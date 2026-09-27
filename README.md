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

## 🏆 Categorization & Channel Groups

Instead of 900+ mixed country folders and 57,000+ cluttered channels, your IPTV is now classified into clean, dedicated sports groups:

1. **🇬🇧 Sky Sports** — Main Event, Premier League, Football, F1, Cricket, Golf, Action, Arena, Tennis, News, Racing, Mix (UK, DE, IT, NZ feeds in UHD/4K/RAW/FHD)
2. **🇬🇧 TNT Sports / BT Sport** — TNT Sports 1, 2, 3, 4, Ultimate, Extra
3. **🇺🇸 ESPN Networks** — ESPN, ESPN2, ESPNU, ESPNews, ESPN Deportes, SEC Network, ACC Network, ESPN+
4. **🌍 BeIN Sports** — beIN Sports 1 through 16, English 1-3, French 1-3, AFC, Max, Premium, 4K
5. **🌍 DAZN** — DAZN 1, DAZN 2, DAZN Bar, DAZN Football, DAZN Combat, DAZN UK/ES/IT/DE
6. **🇿🇦 SuperSport** — Premier League, Grandstand, Football, Variety 1-4, Action, Rugby, Cricket, Motorsport, Tennis, Golf, PSL
7. **🇺🇸 Fox Sports** — FS1, FS2, Fox Sports Racing, Fox Cricket, Fox League, Fox Footy
8. **🇦🇺 Optus Sport & Stan Sport** — Optus Sport 1-11, Stan Sport
9. **🇲🇾 Astro SuperSport** — Astro SuperSport 1-5, Astro Arena, Astro Cricket
10. **🇨🇦 TSN & Sportsnet** — TSN 1-5, Sportsnet Ontario, East, West, Pacific, SN360, SN One, SN World
11. **🇺🇸 US Major Sports** — NBC Sports / USA Network Premier League, CBS Sports Network, Bally Sports / FanDuel, NESN, YES Network, Marquee, Altitude
12. **🏏 Cricket & South Asian Sports** — Willow TV, Willow Xtra, Star Sports 1/2/Select, Sony Sports Ten 1-5, PTV Sports, Geo Super, T Sports, A Sports
13. **🇪🇺 Eurosport** — Eurosport 1, Eurosport 2, 4K across European feeds
14. **🇷🇸 Arena Sport** — Arena Sport 1-10, Arena Premium 1-3
15. **🇪🇸 Movistar Deportes & LaLiga** — Movistar Deportes 1-4, Movistar LaLiga, Liga de Campeones
16. **🇫🇷 Canal+ Sport & RMC** — Canal+ Sport, Canal+ Foot, RMC Sport 1-4, L'Equipe
17. **🇵🇹 Sport TV & Premiere** — Sport TV 1-6, SporTV 1-3, Premiere 1-8, Combate
18. **🇦🇪 Arab Sports (SSC & Alkass)** — SSC Sports 1-5 (Saudi Pro League), Alkass 1-8, Abu Dhabi Sports, Dubai Sports
19. **🏆 US Leagues (NFL, NBA, MLB, NHL)** — NFL Network, NFL RedZone, NBA TV, MLB Network, NHL Network, Golf Channel, Tennis Channel
20. **🥊 Combat & Fight Sports** — UFC Fight Pass, WWE Network, BoxNation, Fight Network, PPV Boxing & MMA
21. **🏎️ Motorsport** — Formula 1, F1 TV, Sky F1, MotoGP, NASCAR, Motorvision
22. **⚽ Football Club Channels** — MUTV, LFCTV, Chelsea TV, Real Madrid TV, Barça TV, Arsenal TV, Man City TV
23. **🎟️ Live Sports PPV & Match Feeds** — Matchday live events and PPV feeds
24. **🌐 Other World Sports Channels** — Regional & world sports networks

---

## 🚀 How It Works Under the Hood

- **Direct 302 Stream Hand-off**: When your TV or player starts a stream, the proxy issues an instant HTTP 302 redirect directly to the IPTV CDN. This means **zero lag**, **zero transcoding**, **zero bandwidth bottlenecks** on your host PC, and untouched **4K / 60fps** video quality.
- **Dynamic Short EPG & Streaming XMLTV**: IPTV Smarters / TiviMate can pull real-time upcoming match listings directly via `action=get_short_epg`, and the background worker generates a clean, filtered `sports_epg.xml` containing only sports channel schedules.
- **Disk Caching**: All channels and categories are cached locally in `channels_cache.json`. When the proxy server boots, it starts in less than 50 milliseconds.

---

## 🛠️ Running the Service

- **Standalone**: Double-click `start.bat` inside `d:\Software\Nuvio setups\xtream-sports-proxy\start.bat`
- **With all services**: Run `start_services.bat` in `d:\Software\Nuvio setups\start_services.bat`
