// epg-sync.js - High-efficiency streaming XMLTV EPG filter for sports channels
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { Transform } = require('stream');

class XmltvSportsFilter extends Transform {
  constructor(validEpgIds, options = {}) {
    super(options);
    this.validEpgIds = validEpgIds;
    this.buffer = '';
    this.headerWritten = false;
    this.matchedChannels = 0;
    this.matchedProgrammes = 0;
  }

  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString('utf8');

    // Extract XMLTV header if not written yet
    if (!this.headerWritten) {
      const tvMatch = this.buffer.match(/<\?xml[\s\S]*?<tv[^>]*>/i);
      if (tvMatch) {
        this.push(tvMatch[0] + '\n');
        this.buffer = this.buffer.slice(tvMatch.index + tvMatch[0].length);
        this.headerWritten = true;
      }
    }

    // Process complete <channel> elements
    let channelIndex;
    while ((channelIndex = this.buffer.indexOf('<channel ')) !== -1) {
      const endIndex = this.buffer.indexOf('</channel>', channelIndex);
      if (endIndex === -1) break; // Incomplete tag, wait for more data

      const channelBlock = this.buffer.slice(channelIndex, endIndex + 10);
      const idMatch = channelBlock.match(/id=["']([^"']+)["']/i);
      if (idMatch && this.validEpgIds.has(idMatch[1].trim().toLowerCase())) {
        this.push('  ' + channelBlock.trim() + '\n');
        this.matchedChannels++;
      }

      this.buffer = this.buffer.slice(endIndex + 10);
    }

    // Process complete <programme> elements
    let progIndex;
    while ((progIndex = this.buffer.indexOf('<programme ')) !== -1) {
      const endIndex = this.buffer.indexOf('</programme>', progIndex);
      if (endIndex === -1) break; // Incomplete tag, wait for more data

      const progBlock = this.buffer.slice(progIndex, endIndex + 12);
      const channelMatch = progBlock.match(/channel=["']([^"']+)["']/i);
      if (channelMatch && this.validEpgIds.has(channelMatch[1].trim().toLowerCase())) {
        this.push('  ' + progBlock.trim() + '\n');
        this.matchedProgrammes++;
      }

      this.buffer = this.buffer.slice(endIndex + 12);
    }

    // Prevent buffer from growing unbounded if non-matching text accumulates
    if (this.buffer.length > 500000) {
      // Find the last incomplete tag start
      const lastTag = Math.max(this.buffer.lastIndexOf('<channel'), this.buffer.lastIndexOf('<programme'));
      if (lastTag !== -1) {
        this.buffer = this.buffer.slice(lastTag);
      } else {
        this.buffer = '';
      }
    }

    callback();
  }

  _flush(callback) {
    this.push('</tv>\n');
    callback();
  }
}

async function syncSportsEpg(upstreamConfig, validEpgIds, outputPath) {
  return new Promise((resolve, reject) => {
    const epgUrl = `${upstreamConfig.serverUrl}/xmltv.php?username=${encodeURIComponent(upstreamConfig.username)}&password=${encodeURIComponent(upstreamConfig.password)}`;
    console.log(`[EPG] Starting streaming XMLTV sync for ${validEpgIds.size} unique sports EPG channels...`);

    const client = epgUrl.startsWith('https') ? https : http;
    const tempFile = outputPath + '.tmp';

    const req = client.get(epgUrl, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Upstream XMLTV returned HTTP ${res.statusCode}`));
      }

      const outStream = fs.createWriteStream(tempFile, { encoding: 'utf8' });
      const filter = new XmltvSportsFilter(validEpgIds);

      res.pipe(filter).pipe(outStream);

      outStream.on('finish', () => {
        try {
          fs.renameSync(tempFile, outputPath);
          console.log(`[EPG] Sync complete: ${filter.matchedChannels} channels, ${filter.matchedProgrammes} programmes saved.`);
          
          // Also create a gzipped version for ultra-fast HTTP serving
          const gzPath = outputPath + '.gz';
          const fileContents = fs.createReadStream(outputPath);
          const writeGz = fs.createWriteStream(gzPath);
          const zip = zlib.createGzip({ level: 6 });
          fileContents.pipe(zip).pipe(writeGz).on('finish', () => {
            console.log(`[EPG] Gzipped EPG cache created at ${gzPath}`);
            resolve({
              channels: filter.matchedChannels,
              programmes: filter.matchedProgrammes,
              sizeBytes: fs.statSync(outputPath).size
            });
          });
        } catch (err) {
          reject(err);
        }
      });

      outStream.on('error', reject);
    });

    req.on('error', reject);
    req.setTimeout(120000, () => {
      req.destroy();
      reject(new Error('Upstream XMLTV request timed out'));
    });
  });
}

module.exports = {
  syncSportsEpg,
  XmltvSportsFilter
};
