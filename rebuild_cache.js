const https = require('https');
const fs = require('fs');
const path = require('path');
const { BRAND_CATEGORIES, classifyStream, cleanChannelName, formatCountryChannel, compareAscendingChannels } = require('./classifier');

const CONFIG_PATH = path.join(__dirname, 'config.json');
const CACHE_PATH = path.join(__dirname, 'channels_cache.json');

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function rebuild() {
  console.log('[Rebuild] Fetching categories and streams directly from upstream IPTV...');
  const userPass = `username=${encodeURIComponent(config.upstream.username)}&password=${encodeURIComponent(config.upstream.password)}`;
  const [cats, streams] = await Promise.all([
    fetchJson(`${config.upstream.serverUrl}/player_api.php?${userPass}&action=get_live_categories`),
    fetchJson(`${config.upstream.serverUrl}/player_api.php?${userPass}&action=get_live_streams`)
  ]);

  const catMap = {};
  cats.forEach(c => catMap[c.category_id] = c.category_name);

  console.log(`[Rebuild] Upstream: ${cats.length} categories, ${streams.length} total channels.`);

  const matched = [];
  const groupCountMap = {};

  for (const s of streams) {
    const catName = catMap[s.category_id] || '';
    const matchedCat = classifyStream(s, catName);

    if (matchedCat) {
      const countryChannelName = formatCountryChannel(s.name, s.epg_channel_id);
      const cleanName = cleanChannelName(s.name);
      const mapped = {
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
      matched.push(mapped);
      groupCountMap[matchedCat.id] = (groupCountMap[matchedCat.id] || 0) + 1;
    }
  }

  console.log(`[Rebuild] Categorized ${matched.length} sports channels.`);

  // Group streams by category, sorting each category in ascending alphabetical order
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

  const activeCats = BRAND_CATEGORIES
    .filter(cat => groupCountMap[cat.id] > 0)
    .map(cat => ({
      category_id: String(cat.id),
      category_name: cat.name,
      parent_id: 0,
      slug: cat.slug,
      count: groupCountMap[cat.id] || 0,
      description: cat.description
    }));

  console.log('\n--- ACTIVE CATEGORIES IN ORDER ---');
  activeCats.forEach((c, i) => console.log((i + 1) + '. [' + c.category_id + '] ' + c.category_name + ' (Count: ' + c.count + ')'));

  console.log('\n--- VERIFY TOP CATEGORY: AS | Asian Sports ---');
  const asianStreams = orderedStreams.filter(s => s.category_id === '100');
  console.log('Total Asian Sports channels in category:', asianStreams.length);
  console.log('First 15 channels (Ascending A-Z):');
  asianStreams.slice(0, 15).forEach((s, idx) => console.log('  ' + (idx + 1) + '. ' + s.name));

  console.log('\n--- VERIFY CLUB CHANNELS (Benfica & Sporting) ---');
  const clubStreams = orderedStreams.filter(s => s.group_slug === 'club-channels');
  const ptClubs = clubStreams.filter(s => /benfica|sporting/i.test(s.name));
  console.log('Portuguese Club channels in Football Club Channels:', ptClubs.length);
  ptClubs.forEach((s, idx) => console.log('  ' + (idx + 1) + '. ' + s.name));

  console.log('\n--- VERIFY PT | Sport TV & Premiere (A Bola TV) ---');
  const ptStreams = orderedStreams.filter(s => s.group_slug === 'pt-sport-tv-premiere');
  const aBola = ptStreams.filter(s => /bola/i.test(s.name));
  console.log('A Bola channels in PT | Sport TV:', aBola.length);
  aBola.forEach((s, idx) => console.log('  ' + (idx + 1) + '. ' + s.name));

  console.log('\n--- VERIFY PL | Sports (Canal+ 360, Sportklub) ---');
  const plStreams = orderedStreams.filter(s => s.group_slug === 'pl-sports');
  console.log('Polish Sports channels in PL | Sports:', plStreams.length);
  plStreams.slice(0, 8).forEach((s, idx) => console.log('  ' + (idx + 1) + '. ' + s.name));

  // Write out cache
  fs.writeFileSync(CACHE_PATH, JSON.stringify({
    lastSyncTime: new Date().toISOString(),
    categories: activeCats,
    streams: orderedStreams
  }), 'utf8');

  console.log(`\n[Rebuild] Successfully saved ${orderedStreams.length} channels across ${activeCats.length} categories to channels_cache.json.`);
}

rebuild().catch(err => console.error(err));
