// server.js - Xtream Codes Sports Proxy Server
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');
const { BRAND_CATEGORIES, classifyStream, cleanChannelName, formatCountryChannel, compareSportsChannels, compareAscendingChannels } = require('./classifier');
const { syncSportsEpg } = require('./epg-sync');


const CONFIG_PATH = path.join(__dirname, 'config.json');
const CACHE_PATH = path.join(__dirname, 'channels_cache.json');
const EPG_PATH = path.join(__dirname, 'sports_epg.xml');

// Load config
let config = {
  upstream: {
    serverUrl: "https://operator2.barfik.org",
    username: "p1aa42v662",
    password: "7w373w9tr3"
  },
  proxy: {
    port: 5055,
    username: "sports",
    password: "sports",
    streamMode: "redirect",
    syncIntervalHours: 12,
    includePPVCategory: true
  }
};

if (fs.existsSync(CONFIG_PATH)) {
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (e) {
    console.error('[Config] Failed to parse config.json, using defaults', e.message);
  }
}

// Override from environment variables if hosted online (e.g. Render, Railway)
if (process.env.UPSTREAM_URL) config.upstream.serverUrl = process.env.UPSTREAM_URL;
if (process.env.UPSTREAM_USER) config.upstream.username = process.env.UPSTREAM_USER;
if (process.env.UPSTREAM_PASS) config.upstream.password = process.env.UPSTREAM_PASS;
if (process.env.PROXY_USER) config.proxy.username = process.env.PROXY_USER;
if (process.env.PROXY_PASS) config.proxy.password = process.env.PROXY_PASS;
if (process.env.PORT) config.proxy.port = parseInt(process.env.PORT, 10);


// In-memory channel store
let sportsStreams = [];
let sportsCategories = [];
let sportsEpgIds = new Set();
let lastSyncTime = null;
let isSyncing = false;

// Helper: Get local IPv4 addresses
function getLocalIps() {
  const ifaces = os.networkInterfaces();
  const ips = [];
  for (const dev in ifaces) {
    ifaces[dev].forEach(details => {
      if (details.family === 'IPv4' && !details.internal) {
        ips.push(details.address);
      }
    });
  }
  return ips.length > 0 ? ips : ['127.0.0.1'];
}

// Upstream fetch helper
function fetchUpstreamJson(endpoint) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${config.upstream.serverUrl}/${endpoint}`;
    const client = fullUrl.startsWith('https') ? https : http;
    const req = client.get(fullUrl, (res) => {
      let chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        try {
          const text = Buffer.concat(chunks).toString('utf8');
          resolve(JSON.parse(text));
        } catch (err) {
          reject(new Error(`Failed to parse JSON from ${endpoint}: ${err.message}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error(`Request to ${endpoint} timed out`));
    });
  });
}

// Sync channels from upstream
async function syncChannels(force = false) {
  if (isSyncing) return;
  isSyncing = true;
  console.log('[Sync] Fetching categories and channels from upstream IPTV...');

  try {
    const userPassParams = `username=${encodeURIComponent(config.upstream.username)}&password=${encodeURIComponent(config.upstream.password)}`;
    const [cats, streams] = await Promise.all([
      fetchUpstreamJson(`player_api.php?${userPassParams}&action=get_live_categories`),
      fetchUpstreamJson(`player_api.php?${userPassParams}&action=get_live_streams`)
    ]);

    const catMap = {};
    if (Array.isArray(cats)) {
      cats.forEach(c => catMap[c.category_id] = c.category_name);
    }

    const matched = [];
    const epgSet = new Set();
    const groupCountMap = {};

    for (const s of streams) {
      const catName = catMap[s.category_id] || '';
      const matchedCat = classifyStream(s, catName);

      if (matchedCat) {
        // Check PPV setting
        if (matchedCat.slug === 'sports-events-ppv' && !config.proxy.includePPVCategory) {
          continue;
        }

        const countryChannelName = formatCountryChannel(s.name, s.epg_channel_id);
        const cleanName = cleanChannelName(s.name);
        const mappedStream = {
          num: matched.length + 1,
          name: countryChannelName,
          original_name: s.name,
          clean_name: cleanName,
          stream_type: "live",
          stream_id: s.stream_id,
          stream_icon: s.stream_icon || '',
          epg_channel_id: s.epg_channel_id || '',
          added: s.added || '',
          category_id: String(matchedCat.id),
          category_ids: [matchedCat.id],
          custom_sid: s.custom_sid || null,
          tv_archive: s.tv_archive || 0,
          direct_source: s.direct_source || '',
          group_name: matchedCat.name,
          group_slug: matchedCat.slug
        };

        matched.push(mappedStream);
        groupCountMap[matchedCat.id] = (groupCountMap[matchedCat.id] || 0) + 1;

        if (s.epg_channel_id && s.epg_channel_id.trim()) {
          epgSet.add(s.epg_channel_id.trim().toLowerCase());
        }
      }
    }

    // Group streams by category, sorting each category's channels in ascending alphabetical order
    const orderedStreams = [];
    for (const cat of BRAND_CATEGORIES) {
      const catStreams = matched.filter(s => s.category_id === String(cat.id));
      if (catStreams.length > 0) {
        catStreams.sort(compareAscendingChannels);
        orderedStreams.push(...catStreams);
      }
    }
    const processedIds = new Set(orderedStreams.map(s => s.stream_id));
    const leftovers = matched.filter(s => !processedIds.has(s.stream_id));
    if (leftovers.length > 0) {
      leftovers.sort(compareAscendingChannels);
      orderedStreams.push(...leftovers);
    }
    orderedStreams.forEach((s, idx) => { s.num = idx + 1; });

    // Prepare active categories list (only categories that have channels)
    sportsCategories = BRAND_CATEGORIES
      .filter(cat => groupCountMap[cat.id] > 0)
      .map(cat => ({
        category_id: String(cat.id),
        category_name: cat.name,
        parent_id: 0,
        slug: cat.slug,
        count: groupCountMap[cat.id] || 0,
        description: cat.description
      }));

    sportsStreams = orderedStreams;
    sportsEpgIds = epgSet;
    lastSyncTime = new Date().toISOString();


    // Save to disk cache
    fs.writeFileSync(CACHE_PATH, JSON.stringify({
      lastSyncTime,
      categories: sportsCategories,
      streams: sportsStreams
    }), 'utf8');

    console.log(`[Sync] Success! ${sportsStreams.length} sports channels categorized across ${sportsCategories.length} brand groups.`);
    console.log(`[Sync] Found ${sportsEpgIds.size} unique sports EPG channels.`);

    // Trigger background EPG sync
    syncSportsEpg(config.upstream, sportsEpgIds, EPG_PATH)
      .catch(err => console.error('[EPG] Background EPG sync error:', err.message));

  } catch (err) {
    console.error('[Sync] Sync failed:', err.message);
  } finally {
    isSyncing = false;
  }
}

// Load cache from disk if available
function loadDiskCache() {
  if (fs.existsSync(CACHE_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
      sportsCategories = data.categories || [];
      sportsStreams = data.streams || [];
      lastSyncTime = data.lastSyncTime || null;
      sportsEpgIds = new Set();
      sportsStreams.forEach(s => {
        if (!s.original_name) {
          s.original_name = s.name;
          s.name = formatCountryChannel(s.original_name, s.epg_channel_id);
        }
        if (s.epg_channel_id && s.epg_channel_id.trim()) {
          sportsEpgIds.add(s.epg_channel_id.trim().toLowerCase());
        }
      });
      // Sort streams inside each category in ascending alphabetical order
      const orderedStreams = [];
      for (const cat of BRAND_CATEGORIES) {
        const catStreams = sportsStreams.filter(s => s.category_id === String(cat.id));
        if (catStreams.length > 0) {
          catStreams.sort(compareAscendingChannels);
          orderedStreams.push(...catStreams);
        }
      }
      const processedIds = new Set(orderedStreams.map(s => s.stream_id));
      const leftovers = sportsStreams.filter(s => !processedIds.has(s.stream_id));
      if (leftovers.length > 0) {
        leftovers.sort(compareAscendingChannels);
        orderedStreams.push(...leftovers);
      }
      orderedStreams.forEach((s, idx) => { s.num = idx + 1; });
      sportsStreams = orderedStreams;
      console.log(`[Cache] Loaded ${sportsStreams.length} cached sports channels from disk (channels sorted ascending A-Z inside each category).`);
      return true;

    } catch (e) {
      console.error('[Cache] Failed to load cache file:', e.message);
    }
  }
  return false;
}

// Authenticate user
function isAuthorized(queryUser, queryPass) {
  if (!queryUser && !queryPass) return false;
  const isProxyUser = queryUser === config.proxy.username && queryPass === config.proxy.password;
  const isUpstreamUser = queryUser === config.upstream.username && queryPass === config.upstream.password;
  return isProxyUser || isUpstreamUser;
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;
  const hostHeader = req.headers.host || `localhost:${config.proxy.port}`;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Xtream Codes Player API: /player_api.php
  if (pathname === '/player_api.php') {
    const username = query.username;
    const password = query.password;

    if (!isAuthorized(username, password)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        user_info: { auth: 0, status: "Disabled", message: "Invalid credentials" }
      }));
      return;
    }

    const action = query.action;

    // Login / Info check
    if (!action) {
      const expDate = Math.floor(Date.now() / 1000) + (365 * 24 * 3600); // 1 year forward
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        user_info: {
          username: username,
          password: password,
          message: "Xtream Sports Curated IPTV",
          auth: 1,
          status: "Active",
          exp_date: String(expDate),
          is_trial: "0",
          active_cons: "0",
          created_at: "1700000000",
          max_connections: "1",
          allowed_output_formats: ["ts", "m3u8"]
        },
        server_info: {
          url: hostHeader.split(':')[0],
          port: hostHeader.split(':')[1] || "80",
          https_port: "443",
          server_protocol: "http",
          rtmp_port: "25462",
          timezone: "UTC",
          timestamp_now: Math.floor(Date.now() / 1000),
          time_now: new Date().toISOString().replace('T', ' ').slice(0, 19),
          process: true
        }
      }));
      return;
    }

    // Categories
    if (action === 'get_live_categories') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(sportsCategories.map(c => ({
        category_id: c.category_id,
        category_name: c.category_name,
        parent_id: 0
      }))));
      return;
    }

    // Live Streams (sorted in ascending alphabetical order inside each category)
    if (action === 'get_live_streams') {
      const categoryId = query.category_id;
      let filtered = sportsStreams;
      if (categoryId) {
        filtered = sportsStreams.filter(s => s.category_id === String(categoryId));
        filtered = filtered.slice().sort(compareAscendingChannels);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(filtered));
      return;
    }

    // Short EPG (Proxy real-time from upstream)
    if (action === 'get_short_epg' || action === 'get_simple_data_table') {
      const streamId = query.stream_id;
      const upstreamUrl = `${config.upstream.serverUrl}/player_api.php?username=${encodeURIComponent(config.upstream.username)}&password=${encodeURIComponent(config.upstream.password)}&action=${action}&stream_id=${encodeURIComponent(streamId || '')}`;
      const client = upstreamUrl.startsWith('https') ? https : http;

      const upReq = client.get(upstreamUrl, (upRes) => {
        res.writeHead(upRes.statusCode, { 'Content-Type': 'application/json' });
        upRes.pipe(res);
      });
      upReq.on('error', (err) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ epg_listings: [] }));
      });
      return;
    }

    // VOD / Series (empty since this is a sports live proxy)
    if (action.includes('vod') || action.includes('series')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([]));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([]));
    return;
  }

  // 2. Live Stream playback: /live/:user/:pass/:streamId
  const liveMatch = pathname.match(/^\/live\/([^\/]+)\/([^\/]+)\/(\d+)(\.[a-zA-Z0-9]+)?$/);
  if (liveMatch) {
    const [, user, pass, streamId, ext = '.ts'] = liveMatch;
    if (!isAuthorized(user, pass)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden: Invalid credentials');
      return;
    }

    const upstreamStreamUrl = `${config.upstream.serverUrl}/live/${config.upstream.username}/${config.upstream.password}/${streamId}${ext}`;

    // Default: 302 Redirect (Fastest, pristine 4K/FHD direct stream from CDN)
    if (config.proxy.streamMode === 'redirect' && query.stream !== 'proxy') {
      res.writeHead(302, { 'Location': upstreamStreamUrl });
      res.end();
      return;
    }

    // Proxy stream pipe mode
    const client = upstreamStreamUrl.startsWith('https') ? https : http;
    const upStreamReq = client.get(upstreamStreamUrl, (upStreamRes) => {
      // Follow 302 from upstream CDN
      if (upStreamRes.statusCode === 302 && upStreamRes.headers.location) {
        const cdnUrl = upStreamRes.headers.location;
        const cdnClient = cdnUrl.startsWith('https') ? https : http;
        cdnClient.get(cdnUrl, (cdnRes) => {
          res.writeHead(cdnRes.statusCode, cdnRes.headers);
          cdnRes.pipe(res);
        }).on('error', (err) => {
          res.writeHead(502, { 'Content-Type': 'text/plain' });
          res.end('Stream CDN error');
        });
        return;
      }

      res.writeHead(upStreamRes.statusCode, upStreamRes.headers);
      upStreamRes.pipe(res);
    });

    upStreamReq.on('error', (err) => {
      console.error('[Stream Error]', err.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('Upstream stream error');
      }
    });

    req.on('close', () => {
      upStreamReq.destroy();
    });
    return;
  }

  // 3. XMLTV EPG: /xmltv.php
  if (pathname === '/xmltv.php') {
    const username = query.username;
    const password = query.password;
    if (!isAuthorized(username, password)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden: Invalid credentials');
      return;
    }

    const gzPath = EPG_PATH + '.gz';
    const acceptGzip = req.headers['accept-encoding'] && req.headers['accept-encoding'].includes('gzip');

    if (acceptGzip && fs.existsSync(gzPath)) {
      res.writeHead(200, {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Encoding': 'gzip'
      });
      fs.createReadStream(gzPath).pipe(res);
      return;
    }

    if (fs.existsSync(EPG_PATH)) {
      res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
      fs.createReadStream(EPG_PATH).pipe(res);
      return;
    }

    // If EPG not yet ready, send basic empty XMLTV and trigger sync
    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
    res.end('<?xml version="1.0" encoding="utf-8"?><tv generator-info-name="XtreamSportsProxy"><channel id="sync"><display-name>EPG Syncing...</display-name></channel></tv>');
    return;
  }

  // 4. M3U Plus Playlist: /get.php
  if (pathname === '/get.php') {
    const username = query.username;
    const password = query.password;
    if (!isAuthorized(username, password)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden: Invalid credentials');
      return;
    }

    const outputExt = query.output === 'm3u8' ? '.m3u8' : '.ts';
    let m3u = '#EXTM3U\n';

    for (const s of sportsStreams) {
      const epgId = s.epg_channel_id || '';
      const icon = s.stream_icon || '';
      const group = s.group_name || 'Sports';
      const cleanName = s.clean_name || s.name;
      const streamUrl = `http://${hostHeader}/live/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${s.stream_id}${outputExt}`;

      m3u += `#EXTINF:-1 tvg-id="${epgId}" tvg-name="${cleanName}" tvg-logo="${icon}" group-title="${group}",${s.name}\n`;
      m3u += `${streamUrl}\n`;
    }

    res.writeHead(200, {
      'Content-Type': 'application/x-mpegURL; charset=utf-8',
      'Content-Disposition': 'inline; filename="sports.m3u"'
    });
    res.end(m3u);
    return;
  }

  // 5. REST API for Web Dashboard
  if (pathname === '/api/status') {
    const localIps = getLocalIps();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: "online",
      serverPort: config.proxy.port,
      streamMode: config.proxy.streamMode,
      localIps: localIps,
      primaryLocalIp: localIps[0],
      credentials: {
        username: config.proxy.username,
        password: config.proxy.password
      },
      upstream: {
        serverUrl: config.upstream.serverUrl,
        username: config.upstream.username
      },
      channelsCount: sportsStreams.length,
      categoriesCount: sportsCategories.length,
      categories: sportsCategories,
      epgCount: sportsEpgIds.size,
      lastSyncTime: lastSyncTime,
      isSyncing: isSyncing
    }));
    return;
  }

  if (pathname === '/api/channels') {
    const catId = query.category;
    const search = (query.search || '').toLowerCase();
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);

    let list = sportsStreams;
    if (catId) {
      list = list.filter(s => s.category_id === String(catId));
    }
    if (search) {
      list = list.filter(s => s.name.toLowerCase().includes(search) || (s.clean_name && s.clean_name.toLowerCase().includes(search)));
    }

    const total = list.length;
    const start = (page - 1) * limit;
    const paged = list.slice(start, start + limit);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      channels: paged
    }));
    return;
  }

  if (pathname === '/api/sync' && req.method === 'POST') {
    if (isSyncing) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "Sync already in progress" }));
      return;
    }
    syncChannels(true);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Sync started in background" }));
    return;
  }

  // 6. Serve static files from public/
  let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'public', 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.svg': 'image/svg+xml',
      '.png': 'image/png'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// Start server and initialize
async function start() {
  const PORT = config.proxy.port || 5055;
  server.listen(PORT, '0.0.0.0', () => {
    const localIps = getLocalIps();
    console.log(`\n======================================================`);
    console.log(`  🏆 Xtream Sports Proxy Running on port ${PORT}`);
    console.log(`  - Local Dashboard: http://localhost:${PORT}`);
    console.log(`  - Network Address: http://${localIps[0]}:${PORT}`);
    console.log(`  - Xtream Username: ${config.proxy.username}`);
    console.log(`  - Xtream Password: ${config.proxy.password}`);
    console.log(`======================================================\n`);
  });

  // Try loading disk cache first for instant boot
  const hasCache = loadDiskCache();
  if (!hasCache || sportsStreams.length === 0) {
    await syncChannels();
  }

  // Set recurring sync interval
  const syncMs = (config.proxy.syncIntervalHours || 12) * 3600 * 1000;
  setInterval(() => {
    console.log('[Interval] Running scheduled channels & EPG sync...');
    syncChannels();
  }, syncMs);
}

start().catch(err => {
  console.error('Fatal startup error:', err);
});
