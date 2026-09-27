// classifier.js - Smart sports channel classifier and grouper broken down by Country & Brand

const COUNTRY_MAP = {
  'UK': 'UK', 'GB': 'UK', 'US': 'US', 'USA': 'US', 'DE': 'DE', 'IT': 'IT', 
  'FR': 'FR', 'ES': 'ES', 'CA': 'CA', 'AU': 'AU', 'NZ': 'NZ', 'PL': 'PL', 
  'NL': 'NL', 'PT': 'PT', 'AR': 'AR', 'SA': 'SA', 'ZA': 'ZA', 'IN': 'IN', 
  'PK': 'PK', 'RS': 'RS', 'HR': 'HR', 'AL': 'AL', 'BG': 'BG', 'RO': 'RO', 
  'GR': 'GR', 'TR': 'TR', 'SE': 'SE', 'NO': 'NO', 'DK': 'DK', 'FI': 'FI', 
  'BE': 'BE', 'CH': 'CH', 'AT': 'AT', 'SG': 'SG', 'MY': 'MY', 'BR': 'BR', 
  'MX': 'MX', 'CL': 'CL', 'LV': 'LV', 'LT': 'LT', 'EE': 'EE', 'IL': 'IL',
  'IE': 'IE', 'CZ': 'CZ', 'SK': 'SK', 'HU': 'HU', 'HK': 'HK', 'AS': 'AS', 'ASIA': 'AS',
  'KR': 'KR', 'ID': 'ID'
};

function detectCountry(raw, epgId = '') {
  let country = null;
  // Match prefix e.g. "UK: ", "(UK) ", "UK - "
  const match = raw.match(/^([A-Z]{2,4})\s*[:|\-]\s*/i) || raw.match(/^\(([A-Z]{2,4})\)\s*/i);
  if (match) {
    const code = match[1].toUpperCase();
    if (COUNTRY_MAP[code]) country = COUNTRY_MAP[code];
  }
  // Match pipe e.g. " | DE: DAZN ...", " | (DE) ... "
  if (!country) {
    const pipeMatch = raw.match(/\|\s*([A-Z]{2,4})\s*:\s*/i) || raw.match(/\|\s*\(([A-Z]{2,4})\)\s*/i);
    if (pipeMatch) {
      const code = pipeMatch[1].toUpperCase();
      if (COUNTRY_MAP[code]) country = COUNTRY_MAP[code];
    }
  }
  // Match EPG ID suffix e.g. "channel.uk"
  if (!country && epgId) {
    const epgMatch = epgId.trim().toLowerCase().match(/\.([a-z]{2})$/);
    if (epgMatch && COUNTRY_MAP[epgMatch[1].toUpperCase()]) {
      country = COUNTRY_MAP[epgMatch[1].toUpperCase()];
    }
  }
  // Keyword heuristics
  if (!country) {
    if (/\b(now\s*tv\b|now:\b|tnt\s*sports?|sky\s*sports\b|premier\s*league\b|national\s*league\b)/i.test(raw)) country = 'UK';
    else if (/\b(wow:\b|skygo:\s*sky\s*sport|bundesliga)/i.test(raw)) country = 'DE';
    else if (/\baustria\b/i.test(raw) && /sky.*sport/i.test(raw)) country = 'AT';
    else if (/\b(optus|stan\s*sport)/i.test(raw)) country = 'AU';
    else if (/\b(tsn\s*[1-5]|sportsnet|sn\s*(now|360|1))/i.test(raw)) country = 'CA';
    else if (/\b(supersport)/i.test(raw)) country = 'ZA';
    else if (/\b(astro\s*(supersport|arena|cricket)|my\s*supersports?)/i.test(raw)) country = 'MY';
    else if (/\b(hk\s*now|now\s*sports?|now\s*premier)/i.test(raw)) country = 'HK';
    else if (/\b(hub\s*sports?|singapore)\b/i.test(raw)) country = 'SG';
    else if (/\b(sports\s*18|dd\s*sports?|d\s*sports?|star\s*sports?|sony\s*(six|ten)|tens?\s*[1-5])/i.test(raw)) country = 'IN';
    else if (/\b(ptv\s*sports?|geo\s*super)\b|\ba\s*[-:]?\s*sports?\b/i.test(raw)) country = 'PK';
    else if (/\b(willow|bally|nesn|yes\s*network|espn\b|fs[12]|sec\s*network|acc\s*network|marquee|altitude|nfl\b|nba\b|mlb\b|nhl\b|flo\s*(sports|racing))/i.test(raw)) country = 'US';
    else if (/\b(movistar|laliga|gol\s*play)/i.test(raw)) country = 'ES';
    else if (/\b(canal\+\s*(sport|foot)|rmc\s*sport|l'equipe)/i.test(raw)) country = 'FR';
    else if (/\b(sport\s*tv\s*[1-7]|premiere\s*\d+|canal\s*combate|benfica\s*tv|sporting\s*tv|a\s*bola\s*tv)/i.test(raw)) country = 'PT';
    else if (/\b(canal\+\s*(360|now)|sportklub|tvp\s*sport)/i.test(raw)) country = 'PL';
    else if (/\b(ssc\s*sports?|alkass|abu\s*dhabi|al\s*fajer)/i.test(raw)) country = 'AR';
    else if (/\b(arena\s*sports?|arena\s*premium)/i.test(raw)) country = 'RS';
    else if (/\bziggo/i.test(raw)) country = 'NL';
    else if (/\b(viasat|v\s*sport)/i.test(raw)) country = 'SE';
    else if (/\b(ppv|ufc|wwe|boxing)/i.test(raw)) country = 'PPV';
    else country = 'INT';
  }
  return country;
}

const ASIAN_SPORTS_PATTERN = /\b(hk\s*now|now\s*sports?|now\s*premier|hub\s*sports?|hub\s*premier|my\s*supersports?|astro\s*(supersport|arena|cricket)|sports\s*18|dd\s*sports?|d\s*sports?|star\s*sports?|sony\s*(six|ten|sports)|tens?\s*(sports?|\d)|ptv\s*sports?|geo\s*super|willow|crlife|ipl\s*\d*|coupang\s*play|mola\s*event|mola\s*ppv)\b|\ba\s*[-:]?\s*sports?\b/i;

// Country & Brand categories ordered:
// 1. AS | Asian Sports (AT THE VERY TOP)
// 2. All US categories (consecutive)
// 3. All UK categories (consecutive)
// 4. Other countries descending: ZA, SE, RS, PT, PL, NZ, NO, NL, IT, IE, FR, FI, EU, ES, DK, DE, CA, AU, AT, AR
// 5. Channel categories with Emojis listed LAST
const BRAND_CATEGORIES = [
  // ==========================================
  // --- TOP CATEGORY: ASIA (AS) ---
  // ==========================================
  {
    id: 100,
    name: 'AS | Asian Sports',
    slug: 'as-asian-sports',
    description: 'Astro SuperSport, Star Sports, Sony Ten, Sony Six, Sports 18, HK Now Sports, StarHub Hub Sports & Premier, Coupang Play, Mola, PTV Sports, A-Sports, Willow',
    match: (name, cat) => {
      if (/radio/i.test(name)) return false;
      const isUpstreamAsia = /asia.*sport|world\s*cricket|coupang\s*play|mola\s*ppv|hub\s*premier/i.test(cat);
      const isAsianBrand = ASIAN_SPORTS_PATTERN.test(name) || ASIAN_SPORTS_PATTERN.test(cat);
      return isUpstreamAsia || isAsianBrand;
    }
  },

  // ==========================================
  // --- GROUP 1: UNITED STATES (US) ---
  // ==========================================
  {
    id: 101,
    name: 'US | ESPN Networks',
    slug: 'us-espn',
    description: 'ESPN, ESPN2, ESPNU, ESPNews, ESPN Deportes, SEC, ACC, ESPN+',
    match: (name, cat, country) => {
      if (/radio/i.test(name)) return false;
      const isEspn = /\bespn\b|\bsec\s*network\b|\bacc\s*network\b/i.test(name) || /\bespn/i.test(cat);
      return isEspn && (country === 'US' || /\bus\s*:/i.test(name) || !country);
    }
  },
  {
    id: 102,
    name: 'US | Fox Sports',
    slug: 'us-fox-sports',
    description: 'FS1, FS2, Fox Sports 1, Fox Sports 2, Fox Sports Racing',
    match: (name, cat, country) => {
      if (/news|movies|series/i.test(name)) return false;
      const isFox = /\bfox\s*sports?\b|\bfs[12]\b/i.test(name) || /\bfox\s*sport/i.test(cat);
      return isFox && (country === 'US' || /\bus\s*:/i.test(name) || !country);
    }
  },
  {
    id: 103,
    name: 'US | Major Sports (NBC, CBS, Bally, NESN, YES)',
    slug: 'us-major-sports',
    description: 'NBC Sports, USA Network Premier League, CBS Sports Network, Bally Sports, FanDuel Sports, NESN, YES, Marquee, Altitude',
    match: (name, cat) => {
      return /\b(nbc\s*sports?|cbs\s*sports?|bally\s*sports?|nesn|yes\s*network|fanduel\s*sports?|marquee\s*sports?|altitude\s*sports?|spectrum\s*sportsnet)\b/i.test(name) ||
             /\b(nbc\s*sport|cbs\s*sport|bally|nesn)\b/i.test(cat);
    }
  },
  {
    id: 104,
    name: 'US | Leagues (NFL, NBA, MLB, NHL)',
    slug: 'us-leagues',
    description: 'NFL Network, NFL RedZone, NBA TV, MLB Network, NHL Network, Golf Channel, Tennis Channel',
    match: (name, cat) => {
      return /\b(nfl\s*network|nfl\s*redzone|nba\s*tv|mlb\s*network|nhl\s*network|golf\s*channel|tennis\s*channel)\b/i.test(name) ||
             /\b(nfl|nba|mlb|nhl)\b/i.test(cat);
    }
  },
  {
    id: 105,
    name: 'US | DAZN',
    slug: 'us-dazn',
    description: 'DAZN US, DAZN Women, DAZN USA',
    match: (name, cat, country) => {
      return /\bdazn\b/i.test(name + ' ' + cat) && (country === 'US' || /\b(us|usa)\s*:/i.test(name));
    }
  },
  {
    id: 106,
    name: 'US | BeIN Sports',
    slug: 'us-bein-sports',
    description: 'beIN Sports USA & beIN Sports en Español',
    match: (name, cat, country) => {
      if (/movies|drama/i.test(name)) return false;
      return (/\bbein\s*sports?\b/i.test(name) || /\bbein\s*sport/i.test(cat)) && country === 'US';
    }
  },
  {
    id: 107,
    name: 'US | FloSports PPV',
    slug: 'us-flosports-ppv',
    description: 'FloSports, FloRacing, Short Track Super Series, Motorsports & Wrestling Feeds',
    match: (name, cat) => {
      return /\b(flo\s*(sports|racing)|floracing)\b/i.test(name) || /flo\s*(racing|sports)\s*ppv/i.test(cat);
    }
  },
  {
    id: 108,
    name: 'US | Flo College PPV',
    slug: 'us-flo-college-ppv',
    description: 'FloSports College Athletics & Championship feeds',
    match: (name, cat) => {
      return /flo\s*college\s*ppv/i.test(cat) || /flo\s*college/i.test(name);
    }
  },
  {
    id: 109,
    name: 'US | NCAAB PPV',
    slug: 'us-ncaab-ppv',
    description: 'NCAA College Basketball live match feeds',
    match: (name, cat) => {
      return /ncaab\s*ppv/i.test(cat) || /\bncaab\b/i.test(name);
    }
  },
  {
    id: 110,
    name: 'US | NCAAF PPV',
    slug: 'us-ncaaf-ppv',
    description: 'NCAA College Football live match feeds',
    match: (name, cat) => {
      return /ncaaf\s*ppv/i.test(cat) || /\bncaaf\b/i.test(name);
    }
  },
  {
    id: 111,
    name: 'US | MILB PPV',
    slug: 'us-milb-ppv',
    description: 'Minor League Baseball live game feeds',
    match: (name, cat) => {
      return /milb\s*ppv/i.test(cat) || /\bmilb\b/i.test(name);
    }
  },
  {
    id: 112,
    name: 'US | Tennis PPV',
    slug: 'us-tennis-ppv',
    description: 'WTA & ATP Tennis tournament live courts',
    match: (name, cat) => {
      return /us\|\s*tennis\s*ppv|ts\|\s*tennis\s*live/i.test(cat) || /\b(wta|atp)\s*(seoul|chengdu|hangzhou|beijing|tokyo|tour)/i.test(name);
    }
  },
  {
    id: 113,
    name: 'US | Matchroom PPV',
    slug: 'us-matchroom-ppv',
    description: 'Matchroom Championship Snooker, Boxing & Darts feeds',
    match: (name, cat) => {
      return /matchroom\s*ppv/i.test(cat) || /matchroom\s*event/i.test(name);
    }
  },
  {
    id: 114,
    name: 'US | MLS PPV',
    slug: 'us-mls-ppv',
    description: 'Major League Soccer live match feeds',
    match: (name, cat) => {
      return /us\|\s*mls\s*ppv/i.test(cat) || /:mls\s+\d+/i.test(name);
    }
  },
  {
    id: 115,
    name: 'US | Golf PPV',
    slug: 'us-golf-ppv',
    description: 'PGA Tour Featured Groups & Holes',
    match: (name, cat) => {
      return /us\|\s*golf\s*ppv/i.test(cat) || /\b(pga\s*tour|dp\s*world\s*tour|nbc\s*golf)\b/i.test(name);
    }
  },
  {
    id: 116,
    name: 'US | Rugby PPV',
    slug: 'us-rugby-ppv',
    description: 'Major League Rugby & International rugby feeds',
    match: (name, cat) => {
      return /us\|\s*rugby\s*ppv/i.test(cat) || /^rugby\s*\d+\s*:/i.test(name);
    }
  },
  {
    id: 117,
    name: 'US | DirtVision PPV',
    slug: 'us-dirtvision-ppv',
    description: 'DirtVision World of Outlaws Sprint Car & Dirt Track Racing',
    match: (name, cat) => {
      return /dirtvision\s*ppv/i.test(cat) || /dirtvision/i.test(name);
    }
  },
  {
    id: 118,
    name: 'US | Max & Paramount+ PPV',
    slug: 'us-max-paramount-ppv',
    description: 'Live sports event feeds on Max US & Paramount+ (NHL, MLB, UEFA, Serie A)',
    match: (name, cat) => {
      return /us\|\s*(max\s*ppv|paramount\+\s*ppv)/i.test(cat) || /:(max\s*us|paramount\+)\s+\d+/i.test(name);
    }
  },

  // ==========================================
  // --- GROUP 2: UNITED KINGDOM (UK) ---
  // ==========================================
  {
    id: 119,
    name: 'UK | Sky Sports',
    slug: 'uk-sky-sports',
    description: 'UK Sky Sports Main Event, Premier League, Football, F1, Cricket, Golf, Action, Arena, Tennis, News, Mix',
    match: (name, cat, country) => {
      if (/cinema|movie|show|arts|mix\s*docs|atlantic/i.test(name)) return false;
      const isSky = /\bsky\s*sports?\b/i.test(name) || /now.*tv.*sport/i.test(cat) || (/sky.*sport/i.test(cat) && !/cinema|movie/i.test(cat));
      return isSky && country === 'UK';
    }
  },
  {
    id: 120,
    name: 'UK | TNT Sports / BT Sport',
    slug: 'uk-tnt-sports',
    description: 'TNT Sports 1, 2, 3, 4, Ultimate, Extra (formerly BT Sport)',
    match: (name, cat) => {
      return /\b(tnt\s*sports?|bt\s*sports?)\b/i.test(name) || /\btnt\s*sport/i.test(cat);
    }
  },
  {
    id: 121,
    name: 'UK | DAZN',
    slug: 'uk-dazn',
    description: 'DAZN 1, DAZN 4K, DAZN PPV 1-26, DAZN UK',
    match: (name, cat, country) => {
      return /\bdazn\b/i.test(name + ' ' + cat) && (country === 'UK' || /\b(gb|uk)\s*:/i.test(name));
    }
  },
  {
    id: 122,
    name: 'UK | EPL Premier League PPV',
    slug: 'uk-epl-ppv',
    description: 'Premier League team dedicated feeds (Man Utd, City, Liverpool, Arsenal, Chelsea, Spurs) and EPL VIP feeds',
    match: (name, cat) => {
      return /epl\s*premier\s*league\s*ppv/i.test(cat) || /\bepl\s*(0\d|\d{2}|manchester|liverpool|arsenal|chelsea|tottenham)\b/i.test(name);
    }
  },
  {
    id: 123,
    name: 'UK | Championship PPV',
    slug: 'uk-championship-ppv',
    description: 'English EFL Championship team live match feeds',
    match: (name, cat) => {
      return /championship\s*ppv/i.test(cat) || /^champ:\s*/i.test(name);
    }
  },
  {
    id: 124,
    name: 'UK | League One & Two PPV',
    slug: 'uk-league-one-two-ppv',
    description: 'EFL League One & League Two team match feeds',
    match: (name, cat) => {
      return /league\s*(one|two)\s*ppv/i.test(cat) || /^l[12]:\s*/i.test(name);
    }
  },
  {
    id: 125,
    name: 'UK | National League PPV',
    slug: 'uk-national-league-ppv',
    description: 'UK National League live match feeds',
    match: (name, cat) => {
      return /national\s*league\s*ppv/i.test(cat) || /\bnational\s*league\s*\d+\b/i.test(name);
    }
  },
  {
    id: 126,
    name: 'UK | Premier League+ & Super League PPV',
    slug: 'uk-premier-plus-super-league',
    description: 'Premier League+ and Betfred Rugby Super League Plus live event feeds',
    match: (name, cat) => {
      return /premier\s*league\+\s*ppv|super\s*league\s*plus\s*ppv/i.test(cat) || /\b(premier\s*league\+\s*\d+|super\s*league\s*plus)\b/i.test(name);
    }
  },
  {
    id: 127,
    name: 'UK | UEFA Champions League PPV',
    slug: 'uk-uefa-cl-ppv',
    description: 'UEFA Champions League & Europa League match feeds',
    match: (name, cat) => {
      return /(uk|us)\|\s*uefa\s*ppv/i.test(cat) || /^uefa\s*\|\s*\d+/i.test(name);
    }
  },
  {
    id: 128,
    name: 'UK | Scottish Football PPV (SPFL & Cup)',
    slug: 'uk-scottish-football-ppv',
    description: 'Scottish Premiership (SPFL) and Scottish Cup live match feeds',
    match: (name, cat) => {
      return /spfl|scottish\s*cup/i.test(cat) || /^spfl:\s*|^scottish\s*cup\s*\d+:/i.test(name);
    }
  },
  {
    id: 129,
    name: 'UK | European League Club PPV',
    slug: 'uk-euro-club-ppv',
    description: 'Real Madrid, Barcelona, Atletico, Juventus, Inter, Milan dedicated match feeds',
    match: (name, cat) => {
      return /la\s*liga\s*team\s*ppv|serie\s*a\s*team\s*ppv/i.test(cat) || /uk:\s*(la\s*liga|serie\s*a)\s*-\s*/i.test(name);
    }
  },
  {
    id: 130,
    name: 'UK | Prime & BBC Sports PPV',
    slug: 'uk-prime-bbc-ppv',
    description: 'Amazon Prime Video UK sports & BBC Stream pop-up channels',
    match: (name, cat) => {
      return /amazon\s*prime\s*ppv|bbc\s*stream\s*ppv|mono\s*max\s*ppv|hbo\s*max\s*ppv/i.test(cat) ||
             /uk:\s*(amazon\s*\d+|bbc\s*stream|mono\s*max|hbo\s*max)\s*ppv/i.test(name);
    }
  },
  {
    id: 131,
    name: 'UK | Ligue 1 & Friendlies PPV',
    slug: 'uk-ligue1-psf-ppv',
    description: 'French Ligue 1 match feeds & Pre-Season Friendlies (PSF)',
    match: (name, cat) => {
      return /ligue\s*1\s*ppv|psf\s*ppv/i.test(cat) || /^uk:\s*ligue\s*1|^psf\d+/i.test(name);
    }
  },
  {
    id: 132,
    name: 'UK | Darts, Rugby & Volleyball PPV',
    slug: 'uk-darts-rugby-ppv',
    description: 'PDC Board Darts Championship, FloRugby & Volleyball World feeds',
    match: (name, cat) => {
      return /pdc\s*board|florugby|volley\s*ball\s*world|tt\s*races/i.test(cat) ||
             /^pdc\s*board|^florugby|^uk:\s*volley|^uk:\s*tt\s*races/i.test(name);
    }
  },

  // ==========================================
  // --- GROUP 3: OTHER COUNTRIES (DESCENDING) ---
  // ==========================================
  {
    id: 133,
    name: 'ZA | SuperSport',
    slug: 'za-supersport',
    description: 'SuperSport Premier League, Grandstand, Football, Variety 1-4, Action, Rugby, Cricket, PSL',
    match: (name, cat) => {
      return (/\bsupersport\b|\bsuper\s*sport\b/i.test(name) || /\bsupersport/i.test(cat)) && !/my\s*supersport/i.test(name);
    }
  },
  {
    id: 134,
    name: 'SE | Nordic Sports PPV (Play+ & TV4 Play)',
    slug: 'se-nordic-sports-ppv',
    description: 'Swedish Telia Play+, TV4 Play, Expressen sports feeds (ATP Tennis, Hockey, Soccer)',
    match: (name, cat) => {
      return /se\|\s*(play\+|tv4\s*play|expressen)\s*ppv/i.test(cat) || /:(telia\s*play\s*se|tv4\s*play\s*se|expressen)\s+\d+/i.test(name) || /\b(tv4\s*(hockey|fotboll|tennis)|v\s*fotboll)\b/i.test(name);
    }
  },
  {
    id: 135,
    name: 'RS | Arena Sport',
    slug: 'rs-arena-sport',
    description: 'Arena Sport 1-10, Arena Premium 1-3 Serbia & Balkans',
    match: (name, cat) => {
      return /\barena\s*(sports?|premium|esport)\b/i.test(name) || /\barena\s*sport/i.test(cat);
    }
  },
  {
    id: 136,
    name: 'PT | Sport TV & Premiere',
    slug: 'pt-sport-tv-premiere',
    description: 'Sport TV 1-6 Portugal, SporTV 1-3 Brazil, Premiere 1-8, A Bola TV, Combate',
    match: (name, cat) => {
      if (/benfica\s*tv|btv\b|sporting\s*tv/i.test(name)) return false;
      return /\b(sport\s*tv\s*[1-7]|sportv\s*[1-3]|premiere\s*\d+|canal\s*combate|a\s*bola\s*tv)\b/i.test(name) || /\b(sport\s*tv|premiere|desporto)\b/i.test(cat);
    }
  },
  {
    id: 137,
    name: 'PL | Sports (Canal+, Sportklub)',
    slug: 'pl-sports',
    description: 'Canal+ Sport 1-5 Poland, Canal+ 360, Canal+ Now, Sportklub, TVP Sport, Walki PPV (KSW, Fame MMA)',
    match: (name, cat, country) => {
      const isPolish = country === 'PL' || /\bpl\s*:/i.test(name) || /sportowe|sport\s*tvn|walki\s*ppv/i.test(cat);
      return isPolish && (/\b(canal\+\s*(360|now|sport)|sportklub|tvp\s*sport|ksw|fame\s*mma|prime\s*mma)\b/i.test(name) || /sportowe|walki\s*ppv/i.test(cat));
    }
  },
  {
    id: 138,
    name: 'NZ | Sky Sport',
    slug: 'nz-sky-sport',
    description: 'New Zealand Sky Sport 1 through 9, Rugby, Premier League',
    match: (name, cat, country) => {
      const isSky = /\bsky\s*sports?\b/i.test(name) || /sky.*sport/i.test(cat);
      return isSky && country === 'NZ';
    }
  },
  {
    id: 139,
    name: 'NO | TV2 Play & VGTV Sports PPV',
    slug: 'no-tv2-vgtv-ppv',
    description: 'Norway TV2 Play & VGTV sports event feeds (Bicycle, Tennis, Football)',
    match: (name, cat) => {
      return /no\|\s*(tv2\s*play|vgtv)/i.test(cat) || /:(tv2play\s*no|vg)\s+\d+/i.test(name);
    }
  },
  {
    id: 140,
    name: 'NL | Sports PPV (Viaplay & Max)',
    slug: 'nl-sports-ppv',
    description: 'Dutch Viaplay TV & Max Eurosport live feeds',
    match: (name, cat) => {
      return /nl\|\s*(viaplay|max\s*ppv)/i.test(cat) || /:(viaplay\s*nl|max\s*nl)\s+\d+/i.test(name);
    }
  },
  {
    id: 141,
    name: 'IT | Serie A / B / C PPV',
    slug: 'it-serie-a-ppv',
    description: 'Italian Serie A, Serie B, Serie C & Tim Vision match feeds',
    match: (name, cat) => {
      return /it\|\s*serie\s*a/i.test(cat) || /tim\s*vision\s*serie\s*a/i.test(name);
    }
  },
  {
    id: 142,
    name: 'IT | Sky Sport',
    slug: 'it-sky-sport',
    description: 'Italian Sky Sport Calcio, Uno, F1, MotoGP, Football, Tennis',
    match: (name, cat, country) => {
      if (/cinema|movie/i.test(name)) return false;
      const isSky = /\bsky\s*sports?\b|super\s*tennis/i.test(name) || /sky.*sport/i.test(cat);
      return isSky && country === 'IT';
    }
  },
  {
    id: 143,
    name: 'IT | DAZN',
    slug: 'it-dazn',
    description: 'DAZN 1, DAZN 2, DAZN Zona Italy',
    match: (name, cat, country) => {
      return /\bdazn\b/i.test(name + ' ' + cat) && country === 'IT';
    }
  },
  {
    id: 144,
    name: 'IE | Clubber GAA PPV',
    slug: 'ie-clubber-ppv',
    description: 'Clubber Ireland Gaelic GAA, Hurling, Camogie live feeds',
    match: (name, cat) => {
      return /clubber\s*ppv/i.test(cat) || /clubber\s*event/i.test(name);
    }
  },
  {
    id: 145,
    name: 'IE | Setanta Sports PPV',
    slug: 'ie-setanta-ppv',
    description: 'Setanta Sports Ireland live event feeds',
    match: (name, cat) => {
      return /setanta\s*ppv/i.test(cat) || /setanta\s*\|\s*event/i.test(name);
    }
  },
  {
    id: 146,
    name: 'IE | Gaelic GAA & Hurling PPV',
    slug: 'ie-gaelic-gaa-ppv',
    description: 'GAAGO, GAAGO++, Ulster GAA & Tyrone GAA championship feeds',
    match: (name, cat) => {
      return /gaago|ulster\s*gaa|tyrone\s*gaa/i.test(cat) || /gaago|gaa\+\+|ulster\s*gaa|tyrone\s*gaa/i.test(name);
    }
  },
  {
    id: 147,
    name: 'IE | NIFL Premiership PPV',
    slug: 'ie-nifl-ppv',
    description: 'Northern Ireland Football League (NIFL) Premiership live feeds',
    match: (name, cat) => {
      return /nifl\s*premiership\s*ppv/i.test(cat) || /^nifl\s*\d+\s*\|/i.test(name);
    }
  },
  {
    id: 148,
    name: 'FR | Canal+ Sport & RMC',
    slug: 'fr-canal-rmc-sport',
    description: 'Canal+ Sport, Canal+ Foot, Canal+ Live, RMC Sport 1-4, L\'Equipe, FFF TV',
    match: (name, cat) => {
      return /\b(canal\+\s*(sport|foot|live)|canal\s*top\s*14|rmc\s*sports?|l'equipe|fff\s*tv)\b|\bgolf\+/i.test(name) || /\b(canal\+.*sport|rmc\s*sport|fff\s*tv)\b/i.test(cat);
    }
  },
  {
    id: 149,
    name: 'FR | BeIN Sports',
    slug: 'fr-bein-sports',
    description: 'beIN Sports 1, 2, 3 France & beIN Max 4-10',
    match: (name, cat, country) => {
      if (/movies|drama/i.test(name)) return false;
      return (/\bbein\s*sports?\b/i.test(name) || /\bbein\s*sport/i.test(cat)) && country === 'FR';
    }
  },
  {
    id: 150,
    name: 'FI | Play+ & MTV Sports PPV',
    slug: 'fi-play-mtv-ppv',
    description: 'Finland Telia Play+ & MTV sports event feeds (ATP Tennis, Hockey, Cycling)',
    match: (name, cat) => {
      return /fi\|\s*(play\+|mtv)\s*ppv/i.test(cat) || /:(telia\s*fi|mtv\s*fi)\s+\d+/i.test(name) || /\bmtv\s*(liiga|fotboll)\b/i.test(name);
    }
  },
  {
    id: 151,
    name: 'EU | Eurosport',
    slug: 'eu-eurosport',
    description: 'Eurosport 1, Eurosport 2, Eurosport 4K across European feeds',
    match: (name, cat) => {
      return /\beurosport\b/i.test(name) || /\beurosport/i.test(cat);
    }
  },
  {
    id: 152,
    name: 'EU | Viaplay Sports PPV',
    slug: 'eu-viaplay-ppv',
    description: 'Nordic & European Viaplay event feeds (Premier League, F1, Bundesliga across NO, SE, DK, FI, IS)',
    match: (name, cat) => {
      return /viaplay\s*ppv|viaplay\s*hd|viaplay\s*raw/i.test(cat) || /:viaplay\s*(no|se|dk|fi|is)\s+\d+/i.test(name) || /\b(viaplay\s*(fotboll|vinter|motor|see|dk\d+)|v\s*golf)\b/i.test(name);
    }
  },
  {
    id: 153,
    name: 'EU | Max Sports PPV',
    slug: 'eu-max-sports-ppv',
    description: 'European Max & Eurosport event feeds (Tennis Grand Slams, Snooker, Cycling across NO, SE, DK, FR, ES)',
    match: (name, cat) => {
      return /(no|se|dk|fr|es)\|\s*max\s*ppv/i.test(cat) || /:max\s*(no|se|dk|fr|es)\s+\d+/i.test(name);
    }
  },
  {
    id: 154,
    name: 'ES | Movistar Deportes & LaLiga',
    slug: 'es-movistar-deportes',
    description: 'Movistar Deportes 1-4, Movistar LaLiga, Movistar Liga de Campeones, Gol Play, RFEF',
    match: (name, cat) => {
      return /\b(movistar\s*(deportes|laliga|liga\s*de\s*campeones)|gol\s*play|rfef|1°\s*federacion|copa\s*del\s*rey)\b/i.test(name) || /\b(movistar\s*deportes|laliga|rfef|copa\s*del\s*rey)\b/i.test(cat);
    }
  },
  {
    id: 155,
    name: 'ES | DAZN',
    slug: 'es-dazn',
    description: 'DAZN 1-4, DAZN LaLiga Spain',
    match: (name, cat, country) => {
      return /\bdazn\b/i.test(name + ' ' + cat) && country === 'ES';
    }
  },
  {
    id: 156,
    name: 'DK | Play TV2 Sports PPV',
    slug: 'dk-play-tv2-ppv',
    description: 'Denmark TV2 Play live sports & WTA tennis tournament feeds',
    match: (name, cat) => {
      return /dk\|\s*play\s*tv2\s*ppv/i.test(cat) || /:tv2play\s*dk\s+\d+/i.test(name);
    }
  },
  {
    id: 157,
    name: 'DE | Sky Sport',
    slug: 'de-sky-sport',
    description: 'German Sky Sport Bundesliga, Premier League, Top Event, F1, Tennis',
    match: (name, cat, country) => {
      if (/cinema|movie/i.test(name)) return false;
      const isSky = /\bsky\s*sports?\b/i.test(name) || /sky.*sport/i.test(cat);
      return isSky && country === 'DE';
    }
  },
  {
    id: 158,
    name: 'DE | DAZN',
    slug: 'de-dazn',
    description: 'DAZN 1, DAZN 2 Germany',
    match: (name, cat, country) => {
      return /\bdazn\b/i.test(name + ' ' + cat) && country === 'DE';
    }
  },
  {
    id: 159,
    name: 'DE | Dyn PPV & Bundesliga Replay',
    slug: 'de-dyn-bundesliga-ppv',
    description: 'German Dyn Sports (Handball, Basketball, Volleyball) & Bundesliga match replays',
    match: (name, cat) => {
      return /dyn\s*ppv|bundesliga\s*replay/i.test(cat) || /de:\s*dyn\s*ppv|de:\s*bundesliga\s*replay/i.test(name);
    }
  },
  {
    id: 160,
    name: 'CA | TSN & Sportsnet',
    slug: 'ca-tsn-sportsnet',
    description: 'TSN 1-5, Sportsnet Ontario, East, West, Pacific, SN360, SN One, SN World',
    match: (name, cat) => {
      return /\b(tsn\s*[1-5]|sportsnet|sn\s*(now|360|1|east|west|ontario|pacific|world)|ca:\s*golf)\b/i.test(name) || /\b(tsn|sportsnet)\b/i.test(cat);
    }
  },
  {
    id: 161,
    name: 'CA | WHL & CFL Sports PPV',
    slug: 'ca-whl-cfl-ppv',
    description: 'Canadian Western Hockey League (WHL / CHL) & Canadian Football League (CFL)',
    match: (name, cat) => {
      return /whl\s*ppv|cfl\s*ppv/i.test(cat) || /^chl\s*\d+\s*hd|^ca\s*\|\s*cfl/i.test(name);
    }
  },
  {
    id: 162,
    name: 'AU | Optus Sport & Stan Sport',
    slug: 'au-optus-stan-sport',
    description: 'Optus Sport 1-11, Stan Sport Australia',
    match: (name, cat) => {
      return /\b(optus\s*(sport|\d+)|stan\s*sport|liv\s*golf)\b/i.test(name) || /\boptus\b/i.test(cat);
    }
  },
  {
    id: 163,
    name: 'AU | NRL & AFL Sports PPV',
    slug: 'au-nrl-afl-ppv',
    description: 'Australian National Rugby League (NRL TV) & Australian Football League (AFL TV) match feeds',
    match: (name, cat) => {
      return /nrl\s*tv\s*ppv|afl\s*(tv\s*)?ppv/i.test(cat) || /^nrl\s*tv|^afl\s*tv/i.test(name);
    }
  },
  {
    id: 164,
    name: 'AT | Sky Sport',
    slug: 'at-sky-sport',
    description: 'Sky Sport Austria 1 through 8',
    match: (name, cat, country) => {
      const isSky = /\bsky\s*sports?\b/i.test(name) || /sky.*sport/i.test(cat);
      return isSky && (country === 'AT' || /austria/i.test(name));
    }
  },
  {
    id: 165,
    name: 'AR | Saudi & Arab Sports (SSC & Alkass)',
    slug: 'ar-arab-sports',
    description: 'SSC Sports 1-5 (Saudi Pro League), Alkass 1-8, Abu Dhabi Sports, Dubai Sports',
    match: (name, cat) => {
      return /\b(ssc\s*(sports?|\d+)|alkass\s*\d+|abu\s*dhabi\s*sports?|dubai\s*sports?)\b/i.test(name) || /\b(ssc|alkass|abu\s*dhabi\s*sport)\b/i.test(cat);
    }
  },
  {
    id: 166,
    name: 'AR | BeIN Sports (MENA / Arabic)',
    slug: 'ar-bein-sports',
    description: 'beIN Sports 1-16 Arabic & English 4K, Max, Premium',
    match: (name, cat, country) => {
      if (/movies|drama|series/i.test(name)) return false;
      return (/\bbein\s*sports?\b/i.test(name) || /\bbein\s*sport/i.test(cat)) && 
             (country === 'AR' || country === 'SA' || /arabic|mena|qatar/i.test(cat + ' ' + name) || /english\s*4k|beIN\s*Sp.*rts\s*\d/i.test(name));
    }
  },
  {
    id: 167,
    name: 'AR | UEFA Champions League',
    slug: 'ar-uefa-cl',
    description: 'Dedicated UEFA Champions League feeds (Al Fajer sports 1-17 HD)',
    match: (name, cat) => {
      return /uefa\s*champions\s*league/i.test(cat) || /al\s*fajer\b.*(sport|hd|\d)/i.test(name);
    }
  },
  {
    id: 168,
    name: 'AR | Shahid Bundesliga PPV',
    slug: 'ar-shahid-bundesliga-ppv',
    description: 'Arabic Shahid Bundesliga live feeds & Fanatiz',
    match: (name, cat) => {
      return /shahid\s*bundesliga|fanatiz/i.test(cat) || /ar:\s*bundesliga|fz:\s*l1/i.test(name);
    }
  },

  // ==========================================
  // --- GROUP 5: CATEGORIES WITH EMOJIS (LISTED LAST) ---
  // ==========================================
  {
    id: 169,
    name: '🥊 Combat & Fight Sports (UFC, WWE, Boxing)',
    slug: 'combat-fight',
    description: 'UFC Fight Pass, WWE Network, BoxNation, Fight Network, PPV Boxing & MMA',
    match: (name, cat) => {
      if (/movie|drama/i.test(name)) return false;
      return /\b(ufc|wwe|boxnation|fight\s*network|fight\s*box|boxing|bellator|one\s*championship|videoland.*ppv|ppv\s*mma|aew\s*dynamite|mma\s*tv|mma\s*mexico)\b/i.test(name) || /\b(ufc|wwe|boxing|fight|glory\s*ppv)\b/i.test(cat);
    }
  },
  {
    id: 170,
    name: '🏎️ Motorsport (F1 TV, MotoGP, NASCAR)',
    slug: 'motorsport',
    description: 'Formula 1, F1 TV, MotoGP, NASCAR, Motorvision TV',
    match: (name, cat) => {
      return /\b(formula\s*1|f1\s*tv|motogp|nascar|motorvision)\b/i.test(name) || /\b(f1|formula\s*1|motogp|nascar)\b/i.test(cat);
    }
  },
  {
    id: 171,
    name: '⚽ Football Club Channels',
    slug: 'club-channels',
    description: 'MUTV, LFCTV, Chelsea TV, Real Madrid TV, Barça TV, Arsenal TV, City TV, Inter TV, Benfica TV, Sporting TV',
    match: (name, cat) => {
      return /\b(mutv|lfc\s*tv|chelsea\s*tv|real\s*madrid\s*tv|barca\s*tv|arsenal\s*tv|city\s*tv|inter\s*tv|milan\s*tv|benfica\s*tv|btv\b|sporting\s*tv)\b/i.test(name) ||
             /\b(mutv|lfctv|chelsea\s*tv|club\s*channels?|benfica|sporting\s*tv)\b/i.test(cat);
    }
  },
  {
    id: 172,
    name: '🎟️ Live Sports PPV & Match Feeds',
    slug: 'sports-events-ppv',
    description: 'Dedicated live match event feeds, PPVs, and temporary game links',
    match: (name, cat) => {
      if (/cinema|adult|xxx|erotic/i.test(name) || /cinema|adult|xxx/i.test(cat)) return false;
      const isDateEvent = /\|\s*\d{2,4}[-/]\d{2}[-/]\d{2,4}/i.test(name) ||
                          /\|\s*\d{2}:\d{2}\s*(gmt|cet|cest|est|utc)/i.test(name) ||
                          /\/\/\s*(uk|et|cet)\s+/i.test(name) ||
                          /\(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\)/.test(name) ||
                          /^(end\b|ended\b|live\b|next\b)/i.test(name.trim()) ||
                          /no\s*event\s*streaming/i.test(name);
      const isPPV = /\b(ppv|event|match|live\s*football|replay)\b/i.test(name) || /\b(ppv|event|match|replay)\b/i.test(cat);
      return isDateEvent || (isPPV && /sport|football|soccer|league/i.test(name + ' ' + cat));
    }
  },
  {
    id: 173,
    name: '❓ Unidentified / Other Sports Channels',
    slug: 'unidentified-sports',
    description: 'Sports channels whose specific country or network could not be identified'
  }
];

function cleanChannelName(rawName) {
  if (!rawName) return '';
  return rawName
    .replace(/^#####\s*|\s*#####$/g, '')
    .replace(/^\[[^\]]+\]\s*/, '')
    .trim();
}

function formatCountryChannel(name, epgId = '') {
  let raw = name ? name.trim() : '';
  const country = detectCountry(raw, epgId);
  raw = raw.replace(/^(4k|vip|now|raw|fhd|hd|sd|hevc|skygo|wow)\s*[:|\-]\s*/i, '').trim();
  raw = raw.replace(/^([A-Z]{2,4})\s*[:|\-]\s*/i, '').trim();
  raw = raw.replace(/^\(([A-Z]{2,4})\)\s*/i, '').trim();
  const prefix = country && country !== 'INT' && country !== 'PPV' ? `${country}: ` : '❓: ';
  return `${prefix}${raw}`;
}

function classifyStream(stream, catName = '') {
  const name = stream.name || '';
  if (/^#+.*#+$/.test(name.trim())) return null;

  // Check temporary match events first
  const isMatchEvent = /^(end\b|ended\b|live\b|next\b)/i.test(name.trim()) ||
    /no\s*event\s*streaming/i.test(name) ||
    /\|\s*\d{2,4}[-/]\d{2}[-/]\d{2,4}/i.test(name) ||
    /\|\s*\d{2}:\d{2}\s*(gmt|cet|cest|est|utc)/i.test(name) ||
    /\/\/\s*(uk|et|cet)\s+/i.test(name) ||
    /\(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\)/.test(name);

  // Match against specific country & brand categories
  const country = detectCountry(name, stream.epg_channel_id);

  for (const cat of BRAND_CATEGORIES) {
    if (cat.slug === 'sports-events-ppv' || cat.slug === 'unidentified-sports') continue;
    if (cat.match(name, catName, country)) {
      return cat;
    }
  }

  const ppvCat = BRAND_CATEGORIES.find(c => c.slug === 'sports-events-ppv');
  if (isMatchEvent && ppvCat && ppvCat.match(name, catName)) {
    return ppvCat;
  }

  const unidentCat = BRAND_CATEGORIES.find(c => c.slug === 'unidentified-sports');

  // If sports-related but specific country or brand cannot be identified:
  const isSportsRelated = /\bsports?\b|\bdeportes?\b|\besportes?\b|bein|espn|sky|tnt|dazn|optus|astro|willow|cricket|football|soccer|league|fight|ufc|nba|nfl|mlb|nhl|wwe|boxing|f1|formula|motorsport|racing|desporto|sportowe|alwan|starzplay|shasha|tod\b|epl\b|flsp|flosports|khl\b|match!\s*futbol|ginx\s*esports|telekanal\s*futbol|esport\s*24/i.test(name + ' ' + catName);
  if (isSportsRelated) {
    if (!/cinema|movie|series|adult|xxx|kids/i.test(name + ' ' + catName)) {
      return unidentCat;
    }
  }

  return null;
}

function getFallbackEpg(name) {
  if (!name) return '';
  if (/sky.*sport.*f1/i.test(name)) return 'skysportsf1.uk';
  if (/sky.*sport.*main.*event/i.test(name)) return 'skysportsmainevent.uk';
  if (/sky.*sport.*premier/i.test(name)) return 'skysportspremiereleague.uk';
  if (/sky.*sport.*football/i.test(name)) return 'skysportsfootball.uk';
  if (/sky.*sport.*cricket/i.test(name)) return 'skysportscricket.uk';
  if (/sky.*sport.*golf/i.test(name)) return 'skysportsgolf.uk';
  if (/sky.*sport.*action/i.test(name)) return 'skysportsaction.uk';
  if (/sky.*sport.*arena/i.test(name)) return 'skysportsarena.uk';
  if (/sky.*sport.*tennis/i.test(name)) return 'skysportstennis.uk';
  if (/sky.*sport.*news/i.test(name)) return 'skysportsnews.uk';
  if (/sky.*sport.*mix/i.test(name)) return 'skysportsmix.uk';
  if (/tnt.*sport.*1/i.test(name)) return 'tntsports1.uk';
  if (/tnt.*sport.*2/i.test(name)) return 'tntsports2.uk';
  if (/tnt.*sport.*3/i.test(name)) return 'tntsports3.uk';
  if (/tnt.*sport.*4/i.test(name)) return 'tntsports4.uk';
  if (/optus/i.test(name)) return 'optussport1.au';
  if (/willow/i.test(name)) return 'willow.us';
  if (/\bdazn\s*1\b/i.test(name)) return 'dazn1.uk';
  return '';
}

// Country code weight for descending alphabetical sort:
// AS is highest (110000 - TOP of the list!)
// US is next (100000)
// UK is second (90000)
// Then other countries descending alphabetically (ZA, RS, PT, PL, NZ, IT, etc.)
// Emojis / Unidentified (❓) are lowest (bottom)
function getCountryWeight(code) {
  if (!code || code === '❓' || code === 'INT' || code === 'OTHER' || code === 'PPV') return -999999;
  if (code === 'AS' || code === 'ASIA') return 110000;
  if (code === 'US') return 100000;
  if (code === 'UK' || code === 'GB') return 90000;
  return ((code.charCodeAt(0) || 0) * 100) + (code.charCodeAt(1) || 0);
}

// Compare function for channels (global descending country)
function compareSportsChannels(a, b) {
  const matchA = (a.name || '').match(/^([A-Z]{2,4}|❓):\s*(.*)$/);
  const matchB = (b.name || '').match(/^([A-Z]{2,4}|❓):\s*(.*)$/);
  const codeA = matchA ? matchA[1].toUpperCase() : '❓';
  const codeB = matchB ? matchB[1].toUpperCase() : '❓';
  const restA = matchA ? matchA[2] : (a.clean_name || a.name || '');
  const restB = matchB ? matchB[2] : (b.clean_name || b.name || '');

  const weightA = getCountryWeight(codeA);
  const weightB = getCountryWeight(codeB);

  if (weightA !== weightB) {
    return weightB - weightA;
  }

  return restA.localeCompare(restB, undefined, { sensitivity: 'base', numeric: true });
}

// Ascending alphabetical sort inside each category
function getAscendingChannelKey(stream) {
  let name = (stream.name || '').trim();
  const match = name.match(/^([A-Z]{2,4}|❓):\s*(.*)$/i);
  let rest = match ? match[2] : name;
  rest = rest.replace(/^[-_\s|#*]+/, '');
  rest = rest.replace(/^\[[^\]]+\]\s*/, '');
  rest = rest.replace(/^(4k|fhd|hd|sd|hevc|raw|vip)\s*[:|\-]\s*/i, '');
  rest = rest.replace(/^[-_\s|#*]+/, '');
  return rest.trim();
}

function compareAscendingChannels(a, b) {
  const keyA = getAscendingChannelKey(a);
  const keyB = getAscendingChannelKey(b);
  return keyA.localeCompare(keyB, undefined, { sensitivity: 'base', numeric: true }) ||
         (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base', numeric: true });
}

module.exports = {
  BRAND_CATEGORIES,
  classifyStream,
  cleanChannelName,
  formatCountryChannel,
  getFallbackEpg,
  detectCountry,
  getCountryWeight,
  compareSportsChannels,
  getAscendingChannelKey,
  compareAscendingChannels
};
