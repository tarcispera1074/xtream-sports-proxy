# ⚡ Xtream Sports Proxy & Curated IPTV Hub

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Yousha1011/xtream-sports-proxy)

A lightweight, high-performance Xtream Codes proxy and playlist optimizer that filters tens of thousands of channels down to **only sports channels**, neatly organized and grouped by **Channel Name & Network** (Sky Sports, TNT Sports, ESPN, BeIN, DAZN, SuperSport, etc.), with synchronized **EPG XMLTV** schedules.


---

## 📡 Quick Xtream Codes Login Details

You can enter these credentials into **any IPTV player** (TiviMate, IPTV Smarters, XCIPTV, Televizo, Sparkle, Nuvio, etc.):

### On Local PC (or local machine apps):
- **Server URL**: `http://localhost:5055`
- **Username**: `sports`
- **Password**: `sports`

### On Smart TV / FireStick / Apple TV / Mobile (Home Wi-Fi):
- **Server URL**: `http://10.39.42.149:5055`
- **Username**: `sports`
- **Password**: `sports`

---

## 📋 Direct URLs (M3U & EPG)

| Type | URL |
| :--- | :--- |
| **M3U Plus Playlist** | `http://10.39.42.149:5055/get.php?username=sports&password=sports&type=m3u_plus` |
| **XMLTV EPG Schedule** | `http://10.39.42.149:5055/xmltv.php?username=sports&password=sports` |
| **Web Dashboard** | `http://localhost:5055` (or `http://10.39.42.149:5055`) |

---

## 🏆 Categorization & Channel Groups (Broken Down by Country)

Instead of 900+ mixed country folders and 57,000+ cluttered channels, your IPTV is now classified into clean, country-specific sports groups:

### 🇬🇧 UK & British Sports
- **🇬🇧 UK \| Sky Sports** (Main Event, Premier League, Football, F1 4K, Cricket, Golf, Action, Arena, Tennis, News, Racing, Mix)
- **🇬🇧 UK \| TNT Sports / BT Sport** (TNT Sports 1, 2, 3, 4, Ultimate 4K, Extra)

### 🇩🇪 Germany & Austria
- **🇩🇪 DE \| Sky Sport** (Bundesliga, Premier League, F1, Tennis, Top Event, Mix)
- **🇦🇹 AT \| Sky Sport** (Sky Sport Austria 1 through 8)
- **🇩🇪 DE \| DAZN** (DAZN 1, DAZN 2 Germany)

### 🇮🇹 Italy
- **🇮🇹 IT \| Sky Sport** (Calcio, Uno, F1, MotoGP, Football, Tennis, 24)
- **🇮🇹 IT \| DAZN** (DAZN 1, 2, Zona DAZN Italy)

### 🇳🇿 New Zealand & Australia
- **🇳🇿 NZ \| Sky Sport** (Sky Sport 1 through 9, Rugby, Premier League)
- **🇦🇺 AU \| Optus Sport & Stan Sport** (Optus Sport 1-11, Stan Sport Australia)

### 🇺🇸 United States & Canada
- **🇺🇸 US \| ESPN Networks** (ESPN, ESPN2, ESPNU, ESPNews, ESPN Deportes, SEC, ACC, ESPN+)
- **🇺🇸 US \| Fox Sports** (FS1, FS2, Fox Sports 1, Fox Sports 2, Fox Sports Racing)
- **🇺🇸 US \| Major Sports** (NBC Sports, USA Network Premier League, CBS Sports Network, Bally Sports / FanDuel, NESN, YES, Marquee, Altitude)
- **🇺🇸 US \| Leagues** (NFL Network, NFL RedZone, NBA TV, MLB Network, NHL Network, Golf Channel, Tennis Channel)
- **🇨🇦 CA \| TSN & Sportsnet** (TSN 1-5, Sportsnet Ontario, East, West, Pacific, SN360, SN One, SN World)

### 🌍 Global Networks (Broken down by Region)
- **🇪🇸 ES \| DAZN** (DAZN 1-4, DAZN LaLiga)
- **🇬🇧 UK & US \| DAZN** (DAZN UK, DAZN US, DAZN Boxing)
- **🌍 Global \| DAZN** (International DAZN feeds)
- **🇶🇦 AR \| BeIN Sports (MENA / Arabic)** (beIN Sports 1-16 Arabic, AFC, Max, Premium, 4K)
- **🇫🇷 FR \| BeIN Sports** (beIN Sports 1, 2, 3 France & beIN Max 4-10)
- **🇺🇸 US \| BeIN Sports** (beIN Sports USA & beIN Sports en Español)
- **🌍 Global \| BeIN Sports** (English, Asia, Singapore, Australia)
- **🇿🇦 ZA \| SuperSport** (Premier League, Grandstand, Football, Variety 1-4, Action, Rugby, Cricket, PSL)
- **🇲🇾 MY \| Astro SuperSport** (Astro SuperSport 1-5, Astro Arena, Astro Cricket)
- **🏏 South Asia \| Cricket** (Willow TV, Willow Xtra, Star Sports 1/2/Select, Sony Sports Ten 1-5, PTV Sports, Geo Super)
- **🇪🇺 EU \| Eurosport** (Eurosport 1, Eurosport 2, 4K across European feeds)
- **🇷🇸 RS \| Arena Sport** (Arena Sport 1-10, Arena Premium 1-3 Serbia & Balkans)
- **🇪🇸 ES \| Movistar Deportes & LaLiga** (Movistar Deportes 1-4, Movistar LaLiga, Liga de Campeones)
- **🇫🇷 FR \| Canal+ Sport & RMC** (Canal+ Sport, Canal+ Foot, RMC Sport 1-4, L'Equipe)
- **🇵🇹 PT \| Sport TV & Premiere** (Sport TV 1-6 Portugal, SporTV 1-3 Brazil, Premiere 1-8, Combate)
- **🇦🇪 AR \| Saudi & Arab Sports** (SSC Sports 1-5 Saudi Pro League, Alkass 1-8, Abu Dhabi Sports, Dubai Sports)
- **🥊 Combat & Fight Sports** (UFC Fight Pass, WWE Network, BoxNation, Fight Network, PPV Boxing & MMA)
- **🏎️ Motorsport** (Formula 1, F1 TV, MotoGP, NASCAR, Motorvision TV)
- **⚽ Football Club Channels** (MUTV, LFCTV, Chelsea TV, Real Madrid TV, Barça TV, Arsenal TV, City TV)
- **🎟️ Live Sports PPV & Match Feeds** (Dedicated live match event feeds, PPVs, and temporary game links)
- **❓ Unidentified / Other Sports Channels** (Sports channels whose specific country or network could not be verified)



---

## 🚀 How It Works Under the Hood

- **Direct 302 Stream Hand-off**: When your TV or player starts a stream, the proxy issues an instant HTTP 302 redirect directly to the IPTV CDN. This means **zero lag**, **zero transcoding**, **zero bandwidth bottlenecks** on your host PC, and untouched **4K / 60fps** video quality.
- **Dynamic Short EPG & Streaming XMLTV**: IPTV Smarters / TiviMate can pull real-time upcoming match listings directly via `action=get_short_epg`, and the background worker generates a clean, filtered `sports_epg.xml` containing only sports channel schedules.
- **Disk Caching**: All channels and categories are cached locally in `channels_cache.json`. When the proxy server boots, it starts in less than 50 milliseconds.

---

## 🛠️ Running the Service

- **Standalone**: Double-click `start.bat` inside `d:\Software\Nuvio setups\xtream-sports-proxy\start.bat`
- **With all services**: Run `start_services.bat` in `d:\Software\Nuvio setups\start_services.bat`
