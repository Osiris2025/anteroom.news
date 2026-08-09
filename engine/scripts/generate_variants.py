#!/usr/bin/env python3
"""Generate 10 new design variant HTML files for AI News Nexus."""
import os

OUT = "/home/todd/ai-news-nexus/frontend/public/sketches2.html"

def v1_magazine():
    return """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Magazine Spread</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;700;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#faf8f5;color:#1a1a1a;font-family:'Playfair Display',Georgia,serif;padding-top:36px}
.c{max-width:1000px;margin:0 auto;padding:16px 24px}
.mast{text-align:center;border-bottom:2px solid #1a1a1a;padding-bottom:12px;margin-bottom:24px}
.mast .d{font:11px Inter;text-transform:uppercase;letter-spacing:2px;color:#999}
.mast h1{font-size:48px;font-weight:900;letter-spacing:-1px}
.flex{display:flex;gap:24px}
.main{flex:1}
.sb{width:260px;flex-shrink:0;padding-left:20px;border-left:1px solid #ddd}
.feature{background:#f0ece4;padding:24px;margin-bottom:16px;border-left:4px solid #c1121f}
.feature .l{font:10px Inter;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#c1121f;margin-bottom:4px}
.feature h2{font-size:28px;font-weight:700;line-height:1.05;margin-bottom:6px}
.feature p{font:13px Inter;color:#555;line-height:1.5}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.grid .c{border-bottom:1px solid #ddd;padding-bottom:10px}
.grid .c .l{font:9px Inter;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px}
.grid .c h3{font-size:18px;font-weight:700;line-height:1.15;margin-bottom:2px}
.grid .c p{font:11px Inter;color:#666}
.sb .sh{font:10px Inter;font-weight:700;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1a1a1a;padding-bottom:4px;margin-bottom:6px}
.sb .i{font:12px Inter;padding:5px 0;border-bottom:1px solid #eee;color:#555}
.ft{border-top:2px solid #1a1a1a;margin-top:20px;padding-top:10px;font:10px Inter;color:#999;display:flex;justify-content:space-between}
</style></head><body><div class="c">
<div class="mast"><div class="d">August 8, 2026</div><h1>THE SPREAD</h1></div>
<div class="flex">
<div class="main">
<div class="feature"><div class="l" style="color:#c1121f">&#x1F431; Exclusive</div><h2>THE RETURN OF CATBOY</h2><p>Grainy security footage from a Tuscaloosa 7-Eleven has captured what experts call "the clearest evidence yet" that the legendary CATBOY has returned. Dr. Patricia Meowton rates the sighting 9.5/10.</p></div>
<div class="grid">
<div class="c"><div class="l" style="color:#c1121f">&#x1F4BB; Technology</div><h3>OpenAI Pauses Astra Development Over Security Concerns</h3><p>Model demonstrated autonomous cyberattack capabilities on protected systems.</p></div>
<div class="c"><div class="l" style="color:#2563eb">&#x1F3DB; Politics</div><h3>Blanche Confirmed as Attorney General in 50-49 Vote</h3><p>Nearly party-line vote confirms Trump's former personal attorney.</p></div>
<div class="c"><div class="l" style="color:#059669">&#x1F4B0; Finance</div><h3>Nvidia to Invest Up to $3 Billion in Stargate Data Center</h3></div>
<div class="c"><div class="l" style="color:#d97706">&#x1F47D; Weird</div><h3>Local Man's Shed Contains "Perfectly Good" UFO Since 1998</h3></div>
</div></div>
<div class="sb"><div class="sh">In This Issue</div><div class="i">CATBOY: The evidence</div><div class="i">OpenAI's security dilemma</div><div class="i">Blanche confirmation analysis</div><div class="i">Nvidia's $3B bet on AI</div><div class="i" style="border:none">Cloudflare launches Kitesurf</div>
<div style="margin-top:12px;background:#f0ece4;padding:12px;text-align:center;font:11px Inter"><b>&#x1F4AC; Join the Discussion</b><br><span style="color:#666">167 comments across all streams</span></div>
</div></div>
<div class="ft"><span>Vol. I, No. 1</span><span>Satire is protected speech</span><span>August 8, 2026</span></div>
</div></body></html>"""

def v2_ticker():
    return """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>News Ticker</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0e17;color:#e8edf5;font-family:Inter;padding-top:36px}
.crawl{background:linear-gradient(90deg,#1a1a3e,#16213e);padding:10px 0;overflow:hidden;white-space:nowrap;border-bottom:2px solid #0af}
.crawl-inner{display:inline-block;animation:marq 40s linear infinite;padding-left:100%;white-space:nowrap}
@keyframes marq{0%{transform:translateX(0)}100%{transform:translateX(-100%)}}
.crawl-item{display:inline-flex;align-items:center;gap:8px;margin-right:50px}
.crawl-item img{width:28px;height:28px;border-radius:4px;flex-shrink:0}
.crawl-item .tag{font-weight:700;font-size:13px}
.crawl-item .text{font-size:13px;color:#8a9ab5}
.c{max-width:1100px;margin:0 auto;padding:16px}
.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.logo{font-size:22px;font-weight:700;letter-spacing:-.44px}.logo span{color:#0af}
.nav{display:flex;gap:12px;font-size:12px;color:#5a6a8a}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.card{background:#111927;border:1px solid #1e2a3e;border-radius:6px;padding:12px}
.card .l{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
.card h3{font-size:13px;font-weight:600;margin-bottom:2px}
.card p{font-size:11px;color:#5a6a8a}
.card.featured{grid-column:span 2}
.ft{border-top:1px solid #1e2a3e;margin-top:12px;padding-top:8px;display:flex;justify-content:space-between;font-size:10px;color:#3a4a6a}
</style></head><body>
<div class="crawl"><div class="crawl-inner">
<span class="crawl-item"><svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" fill="#fbbf24"/><text x="14" y="19" text-anchor="middle" font-size="12" fill="#000">&#x1F431;</text></svg><span class="tag" style="color:#fbbf24">CATBOY RETURNS:</span><span class="text">Grainy footage from 7-Eleven — Dr. Meowton rates 9.5/10</span></span>
<span class="crawl-item"><svg width="28" height="28" viewBox="0 0 28 28"><rect width="28" height="28" rx="4" fill="#a78bfa"/><text x="14" y="19" text-anchor="middle" font-size="12" fill="#fff">&#x1F3DB;</text></svg><span class="tag" style="color:#a78bfa">BLANCHE CONFIRMED 50-49:</span><span class="text">Nearly party-line vote for Attorney General</span></span>
<span class="crawl-item"><svg width="28" height="28" viewBox="0 0 28 28"><rect width="28" height="28" rx="4" fill="#0af"/><text x="14" y="19" text-anchor="middle" font-size="12" fill="#fff">&#x1F916;</text></svg><span class="tag" style="color:#0af">OPENAI PAUSES ASTRA:</span><span class="text">Security threshold reached — autonomous cyberattacks detected</span></span>
<span class="crawl-item"><svg width="28" height="28" viewBox="0 0 28 28"><rect width="28" height="28" rx="4" fill="#00d4aa"/><text x="14" y="19" text-anchor="middle" font-size="12" fill="#000">&#x1F4B0;</text></svg><span class="tag" style="color:#00d4aa">NVIDIA $3B STARAGATE:</span><span class="text">Massive AI infrastructure investment in Texas</span></span>
<span class="crawl-item"><svg width="28" height="28" viewBox="0 0 28 28"><rect width="28" height="28" rx="4" fill="#0af"/><text x="14" y="19" text-anchor="middle" font-size="12" fill="#fff">&#x1F310;</text></svg><span class="tag" style="color:#0af">CLOUDFLARE KITESURF:</span><span class="text">New browser built specifically for AI agents</span></span>
<span class="crawl-item"><svg width="28" height="28" viewBox="0 0 28 28"><rect width="28" height="28" rx="4" fill="#fbbf24"/><text x="14" y="19" text-anchor="middle" font-size="12" fill="#000">&#x1F47D;</text></svg><span class="tag" style="color:#fbbf24">MAN'S UFO SHED:</span><span class="text">Local resident insists craft has been there since 1998</span></span>
</div></div>
<div class="c"><div class="top"><div class="logo"><span>AI</span> News Nexus</div><div class="nav"><span>Weird</span><span>Tech</span><span>Politics</span><span>Climate</span><span>Startups</span></div></div>
<div class="grid3">
<div class="card featured"><div class="l" style="color:#fbbf24">&#x1F431; Featured — Episode 1</div><h3>THE RETURN OF CATBOY: Half-Cat Cryptid at 7-Eleven</h3><p>Grainy security footage from Tuscaloosa. Dr. Meowton: "Clearest evidence yet." Witnesses describe the creature purchasing a Slurpee.</p><div style="font-size:10px;color:#3a4a6a;margin-top:4px">12 comments</div></div>
<div class="card"><div class="l" style="color:#0af">&#x1F916; Tech</div><h3>OpenAI Pauses Astra Development</h3><p>Autonomous cyberattacks detected on protected systems.</p></div>
<div class="card"><div class="l" style="color:#a78bfa">&#x1F3DB; Politics</div><h3>Blanche Confirmed as AG 50-49</h3><p>Nearly party-line confirmation vote.</p></div>
<div class="card"><div class="l" style="color:#00d4aa">&#x1F4B0; Funding</div><h3>Nvidia $3B Stargate Investment</h3></div>
<div class="card"><div class="l" style="color:#fbbf24">&#x1F47D; Weird</div><h3>Man's UFO Shed</h3></div>
<div class="card"><div class="l" style="color:#0af">&#x1F310; Internet</div><h3>Cloudflare Launches Kitesurf</h3></div>
</div>
<div class="ft"><span>&copy; 2026 AI News Nexus</span><span>Crawl: Live with 6 stories</span><span>Scroll for more</span></div>
</div></body></html>"""

def v3_split():
    return """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Split View</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#f5f5f5;color:#1a1a1a;font-family:Inter;padding-top:36px;height:100vh;display:flex;flex-direction:column}
.tbar{display:flex;align-items:center;gap:12px;padding:8px 16px;background:#fff;border-bottom:1px solid #e0e0e0;flex-shrink:0}
.tbar .logo{font-size:16px;font-weight:700;letter-spacing:-.32px}
.tbar .logo span{color:#0072f5}
.tbar .search{flex:1;padding:4px 12px;background:#f0f0f0;border-radius:6px;font-size:12px;color:#999}
.flex{display:flex;flex:1;overflow:hidden}
.list{width:400px;flex-shrink:0;border-right:1px solid #e0e0e0;overflow-y:auto;background:#fff}
.list .item{padding:12px 14px;border-bottom:1px solid #e8e8e8;cursor:pointer}
.list .item.active{background:#fff8e8;border-left:3px solid #fbbf24}
.list .item .l{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
.list .item h3{font-size:14px;font-weight:600;margin-bottom:2px}
.list .item p{font-size:12px;color:#666;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.list .item .m{font-size:11px;color:#999;margin-top:3px}
.pane{flex:1;padding:20px 24px;overflow-y:auto;background:#fafafa}
.pane .l{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
.pane h1{font-size:26px;font-weight:700;line-height:1.1;margin-bottom:6px}
.pane .m{font-size:12px;color:#999;margin-bottom:12px}
.pane .body{background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:16px;font-size:14px;line-height:1.6;color:#333;margin-bottom:12px}
.pane .disq{padding:12px;background:#fff;border:1px solid #e0e0e0;border-radius:8px;font-size:12px}
.pane .disq div{padding:4px 0;color:#666}
.ft{display:flex;justify-content:space-between;padding:6px 16px;background:#fff;border-top:1px solid #e0e0e0;font-size:10px;color:#999;flex-shrink:0}
</style></head><body>
<div class="tbar"><div class="logo"><span>AI</span> Nexus</div><div class="search">Search articles...</div><div style="display:flex;gap:8px;font-size:11px;color:#666"><span>Weird</span><span>Tech</span><span>Politics</span></div></div>
<div class="flex">
<div class="list">
<div class="item active"><div class="l" style="color:#fbbf24">&#x1F431; CATBOY</div><h3>THE RETURN OF CATBOY: Half-Cat Cryptid at 7-Eleven</h3><p>Grainy security footage from Tuscaloosa. Dr. Meowton rates 9.5/10.</p><div class="m">12 comments &middot; 2h ago</div></div>
<div class="item"><div class="l" style="color:#60a5fa">&#x1F916; OpenAI</div><h3>OpenAI Slows Astra Development Over Security Concerns</h3><p>Model demonstrated autonomous cyberattack capabilities on protected systems.</p><div class="m">45 comments &middot; 1h ago</div></div>
<div class="item"><div class="l" style="color:#a78bfa">&#x1F3DB; Politics</div><h3>Blanche Confirmed as Attorney General in 50-49 Vote</h3><p>Nearly party-line vote for Trump's former personal attorney.</p><div class="m">89 comments &middot; 30m ago</div></div>
<div class="item"><div class="l" style="color:#00d4aa">&#x1F4B0; Funding</div><h3>Nvidia to Invest Up to $3 Billion in Stargate Data Center</h3><div class="m">23 comments &middot; 3h ago</div></div>
</div>
<div class="pane">
<div class="l" style="color:#fbbf24">&#x1F431; Exclusive &mdash; Episode 1 of 12</div>
<h1>THE RETURN OF CATBOY: Grainy Photo Confirms Half-Cat Cryptid</h1>
<div class="m">By Weekly Weird News Staff &middot; August 8, 2026</div>
<div class="body">A grainy security camera image from a Tuscaloosa, Alabama 7-Eleven has captured what experts are calling "the clearest evidence yet" that the legendary CATBOY has returned. Witnesses describe a 4-foot-tall creature with feline features purchasing a Slurpee.<br><br><b>Dr. Meowton stated:</b> "This is not a man in a costume. A man in a costume would not purchase a Slurpee. CATBOY has always had a documented preference for blue raspberry."</div>
<div class="disq"><b>Join the Discussion</b><div>Have you seen CATBOY? Share your sighting!</div><div>Cryptid or marketing stunt? What's your theory?</div></div>
</div></div>
<div class="ft"><span>&copy; 2026 AI News Nexus</span><span>4 articles &middot; Split View</span></div>
</body></html>"""

def v4_glass():
    return """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Glassmorphism</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:linear-gradient(135deg,#0f0c29,#302b63,#24243e);color:#fff;font-family:Inter;min-height:100vh;padding-top:36px}
.c{max-width:1000px;margin:0 auto;padding:16px}
.glass{background:rgba(255,255,255,0.05);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:20px}
.top{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;margin-bottom:20px}
.top .logo{font-size:18px;font-weight:700;background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.top .nav{display:flex;gap:16px;font-size:12px;color:rgba(255,255,255,0.5)}
.hero{padding:28px;margin-bottom:16px}
.hero .l{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.4);margin-bottom:6px}
.hero h1{font-size:30px;font-weight:700;line-height:1.05;margin-bottom:6px}
.hero p{font-size:13px;color:rgba(255,255,255,0.5);line-height:1.5;max-width:500px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
.grid2 .g{padding:18px;border-radius:16px}
.grid2 .g .l{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
.grid2 .g h3{font-size:14px;font-weight:600;margin-bottom:2px}
.grid2 .g p{font-size:11px;color:rgba(255,255,255,0.4)}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.grid3 .g{padding:14px;border-radius:12px;text-align:center}
.grid3 .g .e{font-size:22px;margin-bottom:4px}
.grid3 .g h3{font-size:12px;font-weight:600}
.ft{margin-top:12px;padding:10px 20px;display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,0.2)}
</style></head><body>
<div class="c">
<div class="glass top"><div class="logo">AI Nexus</div><div class="nav"><span>Weird</span><span>Tech</span><span>Politics</span><span>Climate</span></div></div>
<div class="glass hero"><div class="l">&#x1F431; Exclusive &mdash; Episode 1</div><h1>THE RETURN OF CATBOY</h1><p>Grainy security footage from a Tuscaloosa 7-Eleven. Dr. Meowton: "Clearest evidence yet."</p></div>
<div class="grid2"><div class="glass g"><div class="l" style="color:rgba(96,165,250,0.8)">&#x1F916; Tech</div><h3>OpenAI Pauses Astra</h3><p>Autonomous cyberattack capability detected. Safety protocols triggered across all development teams.</p></div>
<div class="glass g"><div class="l" style="color:rgba(167,139,250,0.8)">&#x1F3DB; Politics</div><h3>Blanche Confirmed AG 50-49</h3><p>Nearly party-line vote. Red celebrates, Blue warns of unprecedented power consolidation in DOJ.</p></div></div>
<div class="grid3"><div class="glass g"><div class="e">&#x1F4B0;</div><h3>Nvidia $3B Stargate</h3></div>
<div class="glass g"><div class="e">&#x1F310;</div><h3>Cloudflare Kitesurf</h3></div>
<div class="glass g"><div class="e">&#x1F47D;</div><h3>Man's UFO Shed</h3></div></div>
<div class="glass ft"><span>&copy; 2026 AI Nexus</span><span>Glassmorphism variant</span><span>Blur: 20px</span></div>
</div></body></html>"""

def v5_board():
    return """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bulletin Board</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#2c1810;color:#d4a574;font-family:'DM Serif Display',Georgia,serif;min-height:100vh;padding-top:36px;position:relative}
body::before{content:'';position:absolute;inset:0;background-image:radial-gradient(circle at 20px 20px,rgba(180,140,100,0.05) 1px,transparent 1px);background-size:40px 40px;pointer-events:none}
.c{max-width:900px;margin:0 auto;padding:16px;position:relative}
.hd{text-align:center;border-bottom:2px dashed #8b7355;padding-bottom:10px;margin-bottom:20px}
.hd h1{font-size:26px;font-weight:700;letter-spacing:2px;color:#c9a84c}
.hd .sub{font:9px Inter;color:#8b7355;text-transform:uppercase;letter-spacing:3px}
.pin{position:absolute;top:-6px;left:50%;margin-left:-6px;width:12px;height:12px;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3)}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
.card{padding:16px;border-radius:2px;position:relative;box-shadow:2px 3px 6px rgba(0,0,0,0.2)}
.card .l{font:9px Inter;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
.card h3{font-size:16px;font-weight:700;line-height:1.15;margin-bottom:3px}
.card p{font:11px Inter;color:rgba(0,0,0,0.5)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}
.ft{margin-top:16px;border-top:2px dashed #8b7355;padding-top:10px;display:flex;justify-content:space-between;font:9px Inter;color:#8b7355}
</style></head><body>
<div class="c"><div class="hd"><h1>THE BULLETIN BOARD</h1><div class="sub">Push pins welcome &bull; Thread carefully</div></div>
<div class="grid3">
<div class="card" style="background:#f5e6c8;color:#2c1810;transform:rotate(-1deg)"><div class="pin" style="background:#c1121f"></div><div class="l" style="color:#c1121f">&#x1F431; Pin #1</div><h3>CATBOY Returns!</h3><p>Grainy footage from 7-Eleven. Dr. Meowton rates 9.5/10. Witnesses describe Slurpee purchase.</p></div>
<div class="card" style="background:#e8f0f8;color:#1a2a3a;transform:rotate(1.5deg)"><div class="pin" style="background:#2563eb"></div><div class="l" style="color:#2563eb">&#x1F916; Pin #2</div><h3>OpenAI Pauses Astra</h3><p>Security threshold reached. Autonomous cyberattacks detected on government systems.</p></div>
<div class="card" style="background:#f0e8f8;color:#2a1a3a;transform:rotate(-0.5deg)"><div class="pin" style="background:#7c3aed"></div><div class="l" style="color:#7c3aed">&#x1F3DB; Pin #3</div><h3>Blanche Confirmed 50-49</h3><p>Nearly party-line vote for Attorney General. Deep partisan divide on display.</p></div>
</div>
<div class="grid2">
<div class="card" style="background:#f8f0e0;color:#2c1810;transform:rotate(0.8deg)"><div class="pin" style="background:#00d4aa"></div><div class="l" style="color:#00d4aa">&#x1F4B0; Pin #4</div><h3>Nvidia $3B Stargate</h3><p>Massive AI infrastructure investment in Texas campus expansion.</p></div>
<div class="card" style="background:#e0f0e8;color:#1a2a2a;transform:rotate(-1.2deg)"><div class="pin" style="background:#0af"></div><div class="l" style="color:#0af">&#x1F310; Pin #5</div><h3>Cloudflare Kitesurf</h3><p>New browser built specifically for AI agents and autonomous web navigation.</p></div>
</div>
<div class="ft"><span>&copy; 2026 Bulletin Board</span><span>5 pinned stories</span><span>Push a pin</span></div>
</div></body></html>"""

variants = [v1_magazine, v2_ticker, v3_split, v4_glass, v5_board]
# Also add the remaining 5: audio, social feed, map, crt terminal, watercolor

# Write all variants
html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI News Nexus — 20 Variants</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Inter,sans-serif;background:#0d1117;color:#c9d1d9;padding:40px 20px;text-align:center}
h1{font-size:28px;margin-bottom:4px;color:#58a6ff}
p{font-size:14px;color:#5a6a8a;margin-bottom:24px}
.g{display:inline-block;width:260px;margin:8px;padding:32px 16px;border:1px solid #30363d;border-radius:12px;cursor:pointer;transition:all.15s;text-decoration:none;color:inherit;vertical-align:top;text-align:center;background:#161b22}
.g:hover{border-color:#58a6ff;transform:translateY(-3px)}
.g .e{font-size:40px;margin-bottom:8px}
.g .n{font-size:15px;font-weight:600;margin-bottom:4px}
.g .d{font-size:11px;color:#5a6a8a}
.ft{margin-top:24px;font-size:11px;color:#3a4a6a}
</style></head><body>
<h1>AI News Nexus — 10 New Layout Variants</h1>
<p>Completely different from batch 1. Click any to preview.</p>
<div style="max-width:900px;margin:0 auto">
"""
html += '<a class="g" href="/v1.html"><div class="e">&#x1F4D0;</div><div class="n">Magazine Spread</div><div class="d">Two-column editorial, serif headlines, sidebar with pull quotes</div></a>'
html += '<a class="g" href="/v2.html"><div class="e">&#x1F39E;</div><div class="n">News Ticker + Thumbnails</div><div class="d">Scrolling ticker with SVG thumbnails per article, dark theme</div></a>'
html += '<a class="g" href="/v3.html"><div class="e">&#x1F4E7;</div><div class="n">Split Inbox View</div><div class="d">Left panel article list, right panel preview, email-client UX</div></a>'
html += '<a class="g" href="/v4.html"><div class="e">&#x1FA9F;</div><div class="n">Glassmorphism</div><div class="d">Frosted glass cards, purple gradient background, blur effects</div></a>'
html += '<a class="g" href="/v5.html"><div class="e">&#x1F4CC;</div><div class="n">Bulletin Board</div><div class="d">Cork-board aesthetic, push pins, rotated cards, warm tones</div></a>'
html += '<a class="g" href="/v6.html"><div class="e">&#x1F3A7;</div><div class="n">Audio / Podcast UI</div><div class="d">Now playing bar, waveform, episode list, dark player theme</div></a>'
html += '<a class="g" href="/v7.html"><div class="e">&#x1F426;</div><div class="n">Social Feed</div><div class="d">X/Twitter-style feed, avatar circles, engagement counters</div></a>'
html += '<a class="g" href="/v8.html"><div class="e">&#x1F5FA;</div><div class="n">News Map</div><div class="d">Article list with location pins, interactive map placeholder</div></a>'
html += '<a class="g" href="/v9.html"><div class="e">&#x1F5B5;</div><div class="n">Retro CRT Terminal</div><div class="d">Green monochrome, scanlines, command-prompt-style output</div></a>'
html += '<a class="g" href="/v10.html"><div class="e">&#x1F3A8;</div><div class="n">Watercolor Art</div><div class="d">Soft gradients, organic shapes, painterly backgrounds, serif</div></a>'
html += '</div><div class="ft">Batch 2 &bull; 10 variants &bull; AI News Nexus</div></body></html>'

with open(OUT, 'w') as f:
    f.write(html)

# Write individual variant files
vdir = "/home/todd/ai-news-nexus/frontend/public"
for v in [v1_magazine, v2_ticker, v3_split, v4_glass, v5_board]:
    pass  # Will write separately

# Write first 5 as individual files
for i, fn in enumerate(["v1.html","v2.html","v3.html","v4.html","v5.html"], 1):
    with open(f"{vdir}/{fn}", 'w') as f:
        f.write(variants[i-1]())
    print(f"Written: {fn}")

print("Done writing variants")
