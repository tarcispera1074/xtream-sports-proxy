const fs = require('fs');
const { BRAND_CATEGORIES, classifyStream, cleanChannelName, formatCountryChannel, compareSportsChannels } = require('./classifier');

const raw = JSON.parse(fs.readFileSync('./channels_cache.json', 'utf8'));
console.log('Original stream count:', raw.streams.length);

const groupCountMap = {};
const updatedStreams = [];

for (const s of raw.streams) {
  const origName = s.original_name || s.name;
  let epgId = s.epg_channel_id || '';
  if (epgId === 'dazn1.uk' && !/\bdazn\s*1\b/i.test(origName)) {
    epgId = '';
  }
  const dummyStream = { name: origName, epg_channel_id: epgId };
  const matchedCat = classifyStream(dummyStream, s.group_name || '');
  if (matchedCat) {
    const countryName = formatCountryChannel(origName, epgId);
    const cleanName = cleanChannelName(origName);
    const mapped = {
      ...s,
      original_name: origName,
      name: countryName,
      clean_name: cleanName,
      epg_channel_id: epgId,
      category_id: String(matchedCat.id),
      category_ids: [matchedCat.id],
      group_name: matchedCat.name,
      group_slug: matchedCat.slug
    };
    updatedStreams.push(mapped);
    groupCountMap[matchedCat.id] = (groupCountMap[matchedCat.id] || 0) + 1;
  }
}

updatedStreams.sort(compareSportsChannels);
updatedStreams.forEach((s, idx) => { s.num = idx + 1; });

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

console.log('\n--- SAMPLE STREAMS (FIRST 10) ---');
updatedStreams.slice(0, 10).forEach(s => console.log(s.num, s.name));

console.log('\n--- SAMPLE STREAMS (TRANSITION TO UK) ---');
const firstUkIdx = updatedStreams.findIndex(s => s.name.startsWith('UK:'));
console.log('First UK at index:', firstUkIdx);
updatedStreams.slice(firstUkIdx - 2, firstUkIdx + 5).forEach(s => console.log(s.num, s.name));

console.log('\n--- SAMPLE STREAMS (LAST 10) ---');
updatedStreams.slice(-10).forEach(s => console.log(s.num, s.name));

// Overwrite cache with properly classified & sorted streams and categories
fs.writeFileSync('./channels_cache.json', JSON.stringify({
  lastSyncTime: new Date().toISOString(),
  categories: activeCats,
  streams: updatedStreams
}, null, 2), 'utf8');

console.log('\nCache successfully updated with', updatedStreams.length, 'streams and', activeCats.length, 'categories.');
