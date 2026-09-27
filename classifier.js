// classifier.js - Smart sports channel classifier and grouper

const BRAND_CATEGORIES = [
  {
    id: 101,
    name: '🇬🇧 Sky Sports',
    slug: 'sky-sports',
    description: 'Sky Sports Main Event, Premier League, Football, F1, Cricket, Golf, Tennis, Action, Arena',
    match: (name, cat) => {
      if (/cinema|movie|show|arts|mix\s*docs|atlantic/i.test(name)) return false;
      return /\bsky\s*sports?\b/i.test(name) || /now.*tv.*sport/i.test(cat) || (/sky.*sport/i.test(cat) && !/cinema|movie/i.test(cat));
    }
  },
  {
    id: 102,
    name: '🇬🇧 TNT Sports / BT Sport',
    slug: 'tnt-sports',
    description: 'TNT Sports 1, 2, 3, 4, Ultimate, Extra (formerly BT Sport)',
    match: (name, cat) => {
      return /\b(tnt\s*sports?|bt\s*sports?)\b/i.test(name) || /\btnt\s*sport/i.test(cat);
    }
  },
  {
    id: 103,
    name: '🇺🇸 ESPN Networks',
    slug: 'espn',
    description: 'ESPN, ESPN2, ESPNU, ESPNews, ESPN Deportes, SEC, ACC, ESPN+',
    match: (name, cat) => {
      if (/radio/i.test(name)) return false;
      return /\bespn\b|\bsec\s*network\b|\bacc\s*network\b/i.test(name) || /\bespn/i.test(cat);
    }
  },
  {
    id: 104,
    name: '🌍 BeIN Sports',
    slug: 'bein-sports',
    description: 'beIN Sports 1-16, English, French, AFC, Max, Premium, 4K',
    match: (name, cat) => {
      if (/movies|drama|series/i.test(name)) return false;
      return /\bbein\s*sports?\b/i.test(name) || /\bbein\s*sport/i.test(cat);
    }
  },
  {
    id: 105,
    name: '🌍 DAZN',
    slug: 'dazn',
    description: 'DAZN 1, 2, DAZN Bar, DAZN Football, DAZN Combat, DAZN UK/ES/IT/DE',
    match: (name, cat) => {
      return /\bdazn\b/i.test(name) || /\bdazn\b/i.test(cat);
    }
  },
  {
    id: 106,
    name: '🇿🇦 SuperSport',
    slug: 'supersport',
    description: 'SuperSport Premier League, Grandstand, Football, Variety, Action, Rugby, Cricket, PSL',
    match: (name, cat) => {
      return /\bsupersport\b|\bsuper\s*sport\b/i.test(name) || /\bsupersport/i.test(cat);
    }
  },
  {
    id: 107,
    name: '🇺🇸 Fox Sports',
    slug: 'fox-sports',
    description: 'FS1, FS2, Fox Sports 1, Fox Sports 2, Fox Sports Racing, Fox Cricket, Fox Footy',
    match: (name, cat) => {
      if (/news|movies|series/i.test(name)) return false;
      return /\bfox\s*sports?\b|\bfs[12]\b/i.test(name) || /\bfox\s*sport/i.test(cat);
    }
  },
  {
    id: 108,
    name: '🇦🇺 Optus Sport & Stan Sport',
    slug: 'optus-stan-sport',
    description: 'Optus Sport 1-11, Stan Sport Australia (Premier League & Champions League)',
    match: (name, cat) => {
      return /\b(optus\s*(sport|\d+)|stan\s*sport)\b/i.test(name) || /\boptus\b/i.test(cat);
    }
  },
  {
    id: 109,
    name: '🇲🇾 Astro SuperSport',
    slug: 'astro-supersport',
    description: 'Astro SuperSport 1-5, Astro Arena, Astro Cricket',
    match: (name, cat) => {
      return /\bastro\s*(supersport|arena|cricket)\b/i.test(name) || /\bastro\s*sport/i.test(cat);
    }
  },
  {
    id: 110,
    name: '🇨🇦 TSN & Sportsnet',
    slug: 'tsn-sportsnet',
    description: 'TSN 1-5, Sportsnet Ontario, East, West, Pacific, SN360, SN One, SN World',
    match: (name, cat) => {
      return /\b(tsn\s*[1-5]|sportsnet|sn\s*(now|360|1|east|west|ontario|pacific|world))\b/i.test(name) || /\b(tsn|sportsnet)\b/i.test(cat);
    }
  },
  {
    id: 111,
    name: '🇺🇸 US Major Sports (NBC, CBS, Bally/FanDuel, NESN, YES)',
    slug: 'us-major-sports',
    description: 'NBC Sports, USA Network Premier League, CBS Sports Network, Bally Sports, FanDuel Sports, NESN, YES, Marquee, Altitude',
    match: (name, cat) => {
      return /\b(nbc\s*sports?|cbs\s*sports?|bally\s*sports?|nesn|yes\s*network|fanduel\s*sports?|marquee\s*sports?|altitude\s*sports?|spectrum\s*sportsnet)\b/i.test(name) ||
             /\b(nbc\s*sport|cbs\s*sport|bally|nesn)\b/i.test(cat);
    }
  },
  {
    id: 112,
    name: '🏏 Cricket & South Asian Sports (Willow, Star, Sony Ten)',
    slug: 'cricket-south-asian',
    description: 'Willow TV, Willow Xtra, Star Sports 1/2/Select, Sony Sports Ten 1-5, PTV Sports, Geo Super, T Sports, A Sports',
    match: (name, cat) => {
      return /\b(willow\s*(tv|hd|xtra|\d+)|star\s*sports?|sony\s*(sports|ten|six)|ptv\s*sports?|geo\s*super|t\s*sports|a\s*sports)\b/i.test(name) ||
             /\b(willow|star\s*sport|sony\s*ten|cricket)\b/i.test(cat);
    }
  },
  {
    id: 113,
    name: '🇪🇺 Eurosport',
    slug: 'eurosport',
    description: 'Eurosport 1, Eurosport 2, Eurosport 4K across European feeds',
    match: (name, cat) => {
      return /\beurosport\b/i.test(name) || /\beurosport/i.test(cat);
    }
  },
  {
    id: 114,
    name: '🇷🇸 Arena Sport',
    slug: 'arena-sport',
    description: 'Arena Sport 1-10, Arena Premium 1-3, Arena Sport Croatia/Serbia',
    match: (name, cat) => {
      return /\barena\s*sports?\b|\barena\s*premium\b/i.test(name) || /\barena\s*sport/i.test(cat);
    }
  },
  {
    id: 115,
    name: '🇪🇸 Movistar Deportes & LaLiga',
    slug: 'movistar-deportes',
    description: 'Movistar Deportes 1-4, Movistar LaLiga, Movistar Liga de Campeones, Gol Play',
    match: (name, cat) => {
      return /\b(movistar\s*(deportes|laliga|liga\s*de\s*campeones)|gol\s*play)\b/i.test(name) || /\b(movistar\s*deportes|laliga)\b/i.test(cat);
    }
  },
  {
    id: 116,
    name: '🇫🇷 Canal+ Sport & RMC',
    slug: 'canal-rmc-sport',
    description: 'Canal+ Sport, Canal+ Foot, Canal+ Live, RMC Sport 1-4, L\'Equipe',
    match: (name, cat) => {
      return /\b(canal\+\s*(sport|foot|live)|rmc\s*sports?|l'equipe)\b/i.test(name) || /\b(canal\+.*sport|rmc\s*sport)\b/i.test(cat);
    }
  },
  {
    id: 117,
    name: '🇵🇹 Sport TV & Premiere',
    slug: 'sport-tv-premiere',
    description: 'Sport TV 1-6 Portugal, SporTV 1-3 Brazil, Premiere 1-8, Combate',
    match: (name, cat) => {
      return /\b(sport\s*tv\s*[1-7]|sportv\s*[1-3]|premiere\s*\d+|canal\s*combate)\b/i.test(name) || /\b(sport\s*tv|premiere)\b/i.test(cat);
    }
  },
  {
    id: 118,
    name: '🇦🇪 Arab Sports (SSC & Alkass & AD Sports)',
    slug: 'arab-sports',
    description: 'SSC Sports 1-5 (Saudi Pro League), Alkass 1-8, Abu Dhabi Sports, Dubai Sports',
    match: (name, cat) => {
      return /\b(ssc\s*(sports?|\d+)|alkass\s*\d+|abu\s*dhabi\s*sports?|dubai\s*sports?)\b/i.test(name) || /\b(ssc|alkass|abu\s*dhabi\s*sport)\b/i.test(cat);
    }
  },
  {
    id: 119,
    name: '🏆 US Leagues (NFL, NBA, MLB, NHL, Tennis, Golf)',
    slug: 'us-leagues',
    description: 'NFL Network, NFL RedZone, NBA TV, MLB Network, NHL Network, Golf Channel, Tennis Channel',
    match: (name, cat) => {
      return /\b(nfl\s*network|nfl\s*redzone|nba\s*tv|mlb\s*network|nhl\s*network|golf\s*channel|tennis\s*channel)\b/i.test(name) ||
             /\b(nfl|nba|mlb|nhl)\b/i.test(cat);
    }
  },
  {
    id: 120,
    name: '🥊 Combat & Fight Sports (UFC, WWE, Boxing)',
    slug: 'combat-fight',
    description: 'UFC Fight Pass, WWE Network, BoxNation, Fight Network, PPV Boxing & MMA',
    match: (name, cat) => {
      if (/movie|drama/i.test(name)) return false;
      return /\b(ufc|wwe|boxnation|fight\s*network|fight\s*box|boxing)\b/i.test(name) || /\b(ufc|wwe|boxing|fight)\b/i.test(cat);
    }
  },
  {
    id: 121,
    name: '🏎️ Motorsport (F1, MotoGP, NASCAR)',
    slug: 'motorsport',
    description: 'Formula 1, F1 TV, Sky F1, MotoGP, NASCAR, Motorvision TV',
    match: (name, cat) => {
      return /\b(formula\s*1|f1\s*tv|motogp|nascar|motorvision)\b/i.test(name) || /\b(f1|formula\s*1|motogp|nascar)\b/i.test(cat);
    }
  },
  {
    id: 122,
    name: '⚽ Football Club Channels',
    slug: 'club-channels',
    description: 'MUTV, LFCTV, Chelsea TV, Real Madrid TV, Barça TV, Arsenal TV, Man City TV, Inter TV',
    match: (name, cat) => {
      return /\b(mutv|lfc\s*tv|chelsea\s*tv|real\s*madrid\s*tv|barca\s*tv|arsenal\s*tv|city\s*tv|inter\s*tv|milan\s*tv)\b/i.test(name) ||
             /\b(mutv|lfctv|chelsea\s*tv|club\s*channels?)\b/i.test(cat);
    }
  },
  {
    id: 123,
    name: '🎟️ Live Sports PPV & Match Feeds',
    slug: 'sports-events-ppv',
    description: 'Dedicated live match event feeds, PPVs, and temporary game links',
    match: (name, cat) => {
      if (/cinema|adult|xxx|erotic/i.test(name) || /cinema|adult|xxx/i.test(cat)) return false;
      const isDateEvent = /\|\s*\d{2}-\d{2}-\d{4}/i.test(name) || /\|\s*\d{2}:\d{2}\s*(gmt|cet|cest|est|utc)/i.test(name);
      const isPPV = /\b(ppv|event|match|live\s*football)\b/i.test(name) || /\b(ppv|event|match)\b/i.test(cat);
      return isDateEvent || (isPPV && /sport|football|soccer|league/i.test(name + ' ' + cat));
    }
  },
  {
    id: 124,
    name: '🌐 Other World Sports Channels',
    slug: 'other-sports',
    description: 'General sports channels from around the world',
    match: (name, cat) => {
      if (/cinema|movie|series|adult|xxx|kids/i.test(name) || /cinema|movie|series|adult|xxx|kids/i.test(cat)) return false;
      return /\bsports?\b|\bdeportes?\b|\besportes?\b/i.test(name) || /\bsports?\b|\bdeportes?\b|\besportes?\b/i.test(cat);
    }
  }
];

// Helper to clean channel name for sorting and display
function cleanChannelName(rawName) {
  if (!rawName) return '';
  return rawName
    .replace(/^#####\s*|\s*#####$/g, '')
    .replace(/^\[[^\]]+\]\s*/, '')
    .trim();
}

// Function to classify a stream
function classifyStream(stream, catName = '') {
  const name = stream.name || '';
  if (/^#+.*#+$/.test(name.trim())) return null; // Section banner

  for (const cat of BRAND_CATEGORIES) {
    if (cat.match(name, catName)) {
      return cat;
    }
  }
  return null;
}

module.exports = {
  BRAND_CATEGORIES,
  classifyStream,
  cleanChannelName
};
