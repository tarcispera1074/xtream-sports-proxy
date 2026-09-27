const fs = require('fs');
const { BRAND_CATEGORIES, classifyStream, cleanChannelName, formatCountryChannel, compareAscendingChannels } = require('./classifier');

const raw = JSON.parse(fs.readFileSync('./channels_cache.json', 'utf8'));
console.log('Original stream count:', raw.streams.length);

const groupCountMap = {};
const matchedStreams = [];

for (const s of raw.streams) {
  const origName = s.original_name || s.name;
  let epgId = s.epg_channel_id || '';
  if (epgId === 'dazn1.uk' && !/\bdazn\s*1\b/i.test(origName)) {
    epgId = '';
  }
  const dummyStream = { name: origName, epg_channel_id: epgId };
  let matchedCat = classifyStream(dummyStream, '');
  if (!matchedCat) matchedCat = BRAND_CATEGORIES.find(c => c.slug === 'unidentified-sports');
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
    matchedStreams.push(mapped);
    groupCountMap[matchedCat.id] = (groupCountMap[matchedCat.id] || 0) + 1;
  }
}

// Group streams by category, sorting each category's channels in ascending alphabetical order
const orderedStreams = [];
for (const cat of BRAND_CATEGORIES) {
  const catStreams = matchedStreams.filter(s => s.category_id === String(cat.id));
  if (catStreams.length > 0) {
    catStreams.sort(compareAscendingChannels);
    orderedStreams.push(...catStreams);
  }
}

const processedIds = new Set(orderedStreams.map(s => s.stream_id));
const leftovers = matchedStreams.filter(s => !processedIds.has(s.stream_id));
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

console.log('\n--- VERIFY ASCENDING SORT INSIDE CATEGORIES ---');
const testCats = ['101', '107', '108', '110', '120', '130', '131'];
for (const cid of testCats) {
  const c = activeCats.find(x => x.category_id === cid);
  if (!c) continue;
  console.log('\nCategory: ' + c.category_name + ' (First 5 channels):');
  const catStreams = orderedStreams.filter(s => s.category_id === cid);
  catStreams.slice(0, 5).forEach((s, idx) => console.log('  ' + (idx + 1) + '. ' + s.name));
}

// Overwrite cache with properly classified & sorted streams and categories
fs.writeFileSync('./channels_cache.json', JSON.stringify({
  lastSyncTime: new Date().toISOString(),
  categories: activeCats,
  streams: orderedStreams
}, null, 2), 'utf8');

console.log('\nCache successfully updated with', orderedStreams.length, 'streams and', activeCats.length, 'categories.');
