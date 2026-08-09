#!/usr/bin/env python3
"""Build nexus.html - 10 rich, hand-crafted themes, one file, nothing overwritten."""
import json, os

OUT = "/home/todd/ai-news-nexus/frontend/public/nexus.html"

themes = {}

themes["linear"] = {
    "name": "Linear - Dark Precision",
    "html": """
<div style="background:#08090a;color:#f7f8f8;font-family:Inter,sans-serif;min-height:100vh;padding:40px 24px 24px">
<div style="max-width:1200px;margin:0 auto;display:flex;gap:32px">
<div style="width:200px;flex-shrink:0">
<div style="font-size:18px;font-weight:700;margin-bottom:24px"><span style="color:#7170ff">AI</span> Nexus</div>
<nav style="display:flex;flex-direction:column;gap:2px">
<div style="padding:8px 12px;border-radius:6px;font-size:13px;font-weight:500;background:rgba(255,255,255,0.04);color:#f7f8f8">Weird News</div>
<div style="padding:8px 12px;border-radius:6px;font-size:13px;font-weight:500;color:#8a8f98">Tech Pulse</div>
<div style="padding:8px 12px;border-radius:6px;font-size:13px;font-weight:500;color:#8a8f98">Poli Split</div>
<div style="padding:8px 12px;border-radius:6px;font-size:13px;font-weight:500;color:#8a8f98">Weird and Wild</div>
</nav>
<div style="margin-top:20px;border-top:1px solid rgba(255,255,255,0.05);padding-top:12px">
<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#62666d;margin-bottom:6px">Subscribe</div>
<input placeholder="email" style="width:100%;padding:6px 10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:6px;color:#f7f8f8;font-size:11px;font-family:inherit;margin-bottom:4px">
<button style="width:100%;padding:6px;background:#5e6ad2;color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:500;cursor:pointer">Subscribe</button>
</div>
</div>
<div style="flex:1">
<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.05);margin-bottom:20px">
<div style="color:#8a8f98;font-size:13px">Good morning. 11 new articles.</div>
<div style="display:flex;gap:12px;font-size:12px;color:#8a8f98"><span>Profile</span><span>Support</span></div>
</div>
<div style="padding:24px 0 20px">
<h1 style="font-size:36px;font-weight:600;letter-spacing:-0.792px;line-height:1.1;margin-bottom:6px">Stories emerge from darkness</h1>
<p style="color:#8a8f98;font-size:14px">AI-powered analysis across 7 magazines.</p>
</div>
<div style="margin-bottom:20px">
<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">
<span style="width:8px;height:8px;border-radius:50%;background:#fbbf24;display:inline-block"></span>
<h2 style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#62666d">Weekly Weird News</h2>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
<div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:14px;border-left:3px solid #fbbf24">
<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#fbbf24;margin-bottom:4px">CATBOY EP1</div>
<h3 style="font-size:13px;font-weight:500;line-height:1.3;margin-bottom:2px;letter-spacing:-0.13px">THE RETURN OF CATBOY</h3>
<p style="font-size:11px;color:#8a8f98">Grainy security footage. Dr. Meowton rates 9.5/10.</p>
</div>
<div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:14px">
<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#fbbf24;margin-bottom:4px">UFO</div>
<h3 style="font-size:13px;font-weight:500;line-height:1.3;margin-bottom:2px">Man's UFO Shed</h3>
</div>
</div>
</div>
<div style="margin-top:20px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.05);display:flex;justify-content:space-between;font-size:10px;color:#62666d">
<span>&copy; 2026 AI News Nexus</span>
<span>AI Disclosure</span>
<span>Privacy Terms DMCA</span>
</div>
</div>
</div>
</div>"""
}

themes["vercel"] = {
    "name": "Vercel - White Minimal",
    "html": """
<div style="background:#ffffff;color:#171717;font-family:Inter,sans-serif;min-height:100vh;padding:40px 24px 24px">
<div style="max-width:1100px;margin:0 auto;display:flex;gap:40px">
<div style="width:200px;flex-shrink:0">
<div style="font-size:18px;font-weight:600;letter-spacing:-0.36px;margin-bottom:24px"><span style="color:#0072f5">AI</span> Nexus</div>
<nav style="display:flex;flex-direction:column">
<a style="padding:6px 0;font-size:13px;font-weight:500;color:#171717;text-decoration:none;border-bottom:1px solid #f0f0f0">Weird News</a>
<a style="padding:6px 0;font-size:13px;font-weight:500;color:#666;text-decoration:none;border-bottom:1px solid #f0f0f0">Tech Pulse</a>
<a style="padding:6px 0;font-size:13px;font-weight:500;color:#666;text-decoration:none;border-bottom:1px solid #f0f0f0">Poli Split</a>
<a style="padding:6px 0;font-size:13px;font-weight:500;color:#666;text-decoration:none">Weird and Wild</a>
</nav>
<div style="margin-top:20px;border-top:1px solid #f0f0f0;padding-top:12px">
<div style="font-size:11px;font-weight:600;color:#666;margin-bottom:6px">Newsletter</div>
<input placeholder="email" style="width:100%;padding:6px 10px;border:none;font-size:12px;font-family:inherit;box-shadow:0 0 0 1px rgba(0,0,0,0.08);border-radius:6px;margin-bottom:4px">
<button style="width:100%;padding:6px;background:#171717;color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:500;cursor:pointer;box-shadow:0 0 0 1px rgba(0,0,0,0.08)">Subscribe</button>
</div>
</div>
<div style="flex:1">
<div style="padding:20px 0 24px;border-bottom:1px solid #f0f0f0;margin-bottom:20px">
<h1 style="font-size:36px;font-weight:600;letter-spacing:-1.8px;line-height:1.05;margin-bottom:4px">Clean. Precise. Informed.</h1>
<p style="color:#666;font-size:14px">No noise. Just signal.</p>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
<div style="padding:14px;border-radius:6px;box-shadow:0 0 0 1px rgba(0,0,0,0.08),0 2px 2px rgba(0,0,0,0.04),#fafafa 0 0 0 1px">
<div style="font-size:10px;font-weight:600;color:#fbbf24;margin-bottom:3px">CATBOY</div>
<h3 style="font-size:14px;font-weight:600;letter-spacing:-0.28px;margin-bottom:2px">THE RETURN OF CATBOY</h3>
</div>
<div style="padding:14px;border-radius:6px;box-shadow:0 0 0 1px rgba(0,0,0,0.08),0 2px 2px rgba(0,0,0,0.04),#fafafa 0 0 0 1px">
<div style="font-size:10px;font-weight:600;color:#60a5fa;margin-bottom:3px">TECH</div>
<h3 style="font-size:14px;font-weight:600;letter-spacing:-0.28px;margin-bottom:2px">OpenAI Pauses Astra</h3>
</div>
<div style="padding:14px;border-radius:6px;box-shadow:0 0 0 1px rgba(0,0,0,0.08),0 2px 2px rgba(0,0,0,0.04),#fafafa 0 0 0 1px">
<div style="font-size:10px;font-weight:600;color:#a78bfa;margin-bottom:3px">POLITICS</div>
<h3 style="font-size:14px;font-weight:600;letter-spacing:-0.28px;margin-bottom:2px">Blanche Confirmed AG</h3>
</div>
<div style="padding:14px;border-radius:6px;box-shadow:0 0 0 1px rgba(0,0,0,0.08),0 2px 2px rgba(0,0,0,0.04),#fafafa 0 0 0 1px">
<div style="font-size:10px;font-weight:600;color:#00d4aa;margin-bottom:3px">FUNDING</div>
<h3 style="font-size:14px;font-weight:600;letter-spacing:-0.28px;margin-bottom:2px">Nvidia $3B</h3>
</div>
</div>
<div style="margin-top:20px;padding-top:12px;border-top:1px solid #f0f0f0;display:flex;justify-content:space-between;font-size:11px;color:#999">
<span>&copy; 2026 AI News Nexus</span>
<span>AI Disclosure Privacy Terms</span>
</div>
</div>
</div>
</div>"""
}

themes["tabloid"] = {
    "name": "Tabloid - Newspaper",
    "html": """
<div style="background:#f5f0e8;color:#2a2216;font-family:Georgia,serif;min-height:100vh;padding:40px 16px 16px">
<div style="background:#c1121f;color:#fff;text-align:center;padding:6px;font-size:11px;font-family:Inter;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;max-width:1000px;margin-left:auto;margin-right:auto">
BREAKING: CATBOY SIGHTING CONFIRMED</div>
<div style="max-width:1000px;margin:0 auto">
<div style="text-align:center;border-bottom:3px double #2a2216;padding-bottom:8px;margin-bottom:16px">
<h1 style="font-size:48px;font-weight:900;letter-spacing:-1px;font-family:Playfair Display,Georgia,serif">THE DAILY CRYPTID</h1>
<div style="font-size:10px;font-family:Inter;color:#666;text-transform:uppercase;letter-spacing:1px;margin-top:2px">Tuscaloosa Edition</div>
</div>
<div style="display:flex;gap:24px">
<div style="flex:1">
<div style="border-bottom:2px solid #2a2216;padding-bottom:12px;margin-bottom:12px">
<h1 style="font-size:32px;font-weight:900;line-height:1.05;margin-bottom:4px"><span style="color:#c1121f">EXCLUSIVE:</span> THE RETURN OF CATBOY</h1>
<p style="font-family:Inter;font-size:13px;color:#444;line-height:1.4">Grainy security camera footage from a Tuscaloosa 7-Eleven. Dr. Patricia Meowton rates the sighting 9.5/10 on the Weird-o-Meter.</p>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
<div style="border-bottom:1px solid #ccc;padding-bottom:10px">
<div style="font-family:Inter;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#c1121f;margin-bottom:2px">Capitol</div>
<h3 style="font-size:18px;font-weight:700;line-height:1.15">Blanche Confirmed 50-49</h3>
</div>
<div style="border-bottom:1px solid #ccc;padding-bottom:10px">
<div style="font-family:Inter;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#c1121f;margin-bottom:2px">Technology</div>
<h3 style="font-size:18px;font-weight:700;line-height:1.15">OpenAI Pauses Astra</h3>
</div>
</div>
</div>
<div style="width:240px;flex-shrink:0;padding-left:16px;border-left:1px solid #ccc">
<div style="font-family:Inter;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#c1121f;border-bottom:1px solid #2a2216;padding-bottom:4px;margin-bottom:6px">Also Inside</div>
<div style="font-family:Inter;font-size:12px;padding:5px 0;border-bottom:1px solid #e0d8cc">Man's UFO Shed</div>
<div style="font-family:Inter;font-size:12px;padding:5px 0">Nvidia $3B Stargate</div>
<div style="margin-top:12px;padding:10px;background:#f0ece4;font-family:Inter;text-align:center">
<button style="padding:6px 16px;background:#2a2216;color:#f5f0e8;border:none;font-size:11px;font-weight:700;cursor:pointer">Subscribe</button>
</div>
</div>
</div>
<div style="border-top:2px solid #2a2216;margin-top:16px;padding-top:10px;display:flex;justify-content:space-between;font-family:Inter;font-size:10px;color:#888">
<span>&copy; 2026</span><span>Satire protected</span>
</div>
</div>
</div>"""
}

themes["magazine"] = {
    "name": "Magazine Glow",
    "html": """
<div style="background:#fff;color:#1a1a1a;font-family:Space Grotesk,sans-serif;min-height:100vh;padding:40px 24px 24px">
<div style="max-width:1000px;margin:0 auto">
<div style="background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:24px;font-weight:700;text-align:center">AI News Nexus</div>
<div style="text-align:center;font-size:12px;color:#666;margin-bottom:20px;border-bottom:1px solid #eee;padding-bottom:10px">Where the weird meets the wonderful</div>
<div style="background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;border-radius:16px;padding:24px;margin-bottom:16px">
<div style="font-size:10px;text-transform:uppercase;letter-spacing:2px;opacity:0.6;margin-bottom:6px">CATBOY EP1</div>
<h1 style="font-size:28px;font-weight:700;line-height:1.1;margin-bottom:6px">THE RETURN OF CATBOY</h1>
<p style="font-size:13px;opacity:0.8;line-height:1.5">Grainy security footage from a Tuscaloosa 7-Eleven. Dr. Meowton: "The clearest evidence yet."</p>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
<div style="background:#f8f9fa;border-radius:12px;padding:18px">
<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#667eea;margin-bottom:4px">Tech</div>
<h3 style="font-size:15px;font-weight:600">OpenAI Pauses Astra</h3>
</div>
<div style="background:#f8f9fa;border-radius:12px;padding:18px">
<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#667eea;margin-bottom:4px">Politics</div>
<h3 style="font-size:15px;font-weight:600">Blanche Confirmed AG</h3>
</div>
<div style="background:#f8f9fa;border-radius:12px;padding:18px">
<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#667eea;margin-bottom:4px">Funding</div>
<h3 style="font-size:15px;font-weight:600">Nvidia $3B</h3>
</div>
<div style="background:#f8f9fa;border-radius:12px;padding:18px">
<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#667eea;margin-bottom:4px">Support</div>
<button style="padding:8px 20px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer">Support us</button>
</div>
</div>
<div style="border-top:1px solid #eee;padding-top:10px;display:flex;justify-content:space-between;font-size:11px;color:#999">
<span>&copy; 2026</span><span>AI Disclosure</span>
</div>
</div>
</div>"""
}

themes["terminal"] = {
    "name": "Terminal Hacker",
    "html": """
<div style="background:#000;color:#0f0;font-family:IBM Plex Mono,monospace;min-height:100vh;padding:40px 16px 16px;position:relative">
<div style="position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,255,0,0.02) 50%,transparent 50%);background-size:100% 2px;pointer-events:none;animation:sc 2s linear infinite"></div>
<style>@keyframes sc{0%{transform:translateY(0)}100%{transform:translateY(2px)}}</style>
<div style="max-width:800px;margin:0 auto;border:2px solid #0f0;padding:16px;position:relative">
<div style="text-align:center;border-bottom:1px solid #0f0;padding-bottom:6px;margin-bottom:10px">
<div style="font-size:10px;letter-spacing:4px;text-transform:uppercase">AI NEWS NEXUS</div>
<div style="font-size:8px;color:#060">11 ARTICLES / 7 MAGAZINES / UPTIME: 1d 12h</div>
</div>
<div style="color:#ff0;margin-bottom:4px">$ <span style="color:#0f0">fetch_catboy</span></div>
<div style="padding-left:16px;border-left:2px solid #0f0;margin-bottom:8px">
<div style="font-weight:700;font-size:14px;color:#fff">THE RETURN OF CATBOY</div>
<div style="color:#0a0">Grainy footage from 7-Eleven. Dr. Meowton: 9.5/10.</div>
</div>
<div style="color:#ff0;margin-bottom:4px">$ <span style="color:#0f0">tail --magazine=tech</span></div>
<div style="padding-left:16px;border-left:2px solid #0f0;margin-bottom:8px">
<div style="font-weight:700;color:#fff">OpenAI Pauses Astra</div>
<div style="color:#0a0">Autonomous cyberattack capability detected.</div>
</div>
<div style="color:#ff0;margin-bottom:4px">$ <span style="color:#0f0">tail --magazine=politics</span></div>
<div style="padding-left:16px;border-left:2px solid #0f0;margin-bottom:8px">
<div style="font-weight:700;color:#fff">Blanche Confirmed 50-49</div>
</div>
<div style="border-top:1px solid #0f0;padding-top:6px;display:flex;justify-content:space-between;font-size:10px;color:#060;margin-top:10px">
<span>nexus@home:~$</span><span>_</span>
</div>
</div>
</div>"""
}

themes["cardwall"] = {
    "name": "Card Wall - Masonry",
    "html": """
<div style="background:#f0f2f5;color:#1a1a2e;font-family:Inter,sans-serif;min-height:100vh;padding:40px 16px 16px">
<div style="max-width:1000px;margin:0 auto;text-align:center;margin-bottom:20px">
<h1 style="font-size:28px;font-weight:800">AI News Nexus</h1>
<div style="font-size:11px;color:#666">7 magazines / 11 articles / AI-powered</div>
</div>
<div style="column-count:3;column-gap:14px">
<div style="break-inside:avoid;margin-bottom:14px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border-radius:16px;padding:24px;display:inline-block;width:100%">
<div style="font-size:10px;text-transform:uppercase;opacity:0.7">CATBOY</div>
<h2 style="font-size:20px;font-weight:700;line-height:1.1;margin:4px 0">THE RETURN OF CATBOY</h2>
</div>
<div style="break-inside:avoid;margin-bottom:14px;background:#fff;border-radius:16px;padding:18px;box-shadow:0 2px 8px rgba(0,0,0,0.06);display:inline-block;width:100%">
<div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#667eea">Tech</div>
<h3 style="font-size:16px;font-weight:700;margin:4px 0">OpenAI Pauses Astra</h3>
</div>
<div style="break-inside:avoid;margin-bottom:14px;background:#fff;border-radius:16px;padding:18px;box-shadow:0 2px 8px rgba(0,0,0,0.06);display:inline-block;width:100%">
<h3 style="font-size:16px;font-weight:700">Poll: CATBOY real?</h3>
<div style="margin-top:6px"><button style="padding:6px 12px;border:1px solid #e0e0e0;border-radius:8px;background:#f8f8f8;font-size:12px;cursor:pointer;margin-right:4px">Real</button><button style="padding:6px 12px;border:1px solid #e0e0e0;border-radius:8px;background:#f8f8f8;font-size:12px;cursor:pointer">Hoax</button></div>
</div>
<div style="break-inside:avoid;margin-bottom:14px;background:#fff;border-radius:16px;padding:18px;box-shadow:0 2px 8px rgba(0,0,0,0.06);display:inline-block;width:100%">
<div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#667eea">Support</div>
<button style="width:100%;padding:8px;background:#1a1a2e;color:#fff;border:none;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;margin-top:6px">Become a Supporter</button>
</div>
<div style="break-inside:avoid;margin-bottom:14px;background:#fff;border-radius:16px;padding:18px;box-shadow:0 2px 8px rgba(0,0,0,0.06);display:inline-block;width:100%">
<div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#667eea">Subscribe</div>
<input placeholder="email" style="width:100%;padding:8px;border:1px solid #e0e0e0;border-radius:10px;font-size:12px;margin-bottom:6px">
<button style="width:100%;padding:8px;background:#1a1a2e;color:#fff;border:none;border-radius:10px;font-size:12px;cursor:pointer">Subscribe</button>
</div>
</div>
<div style="text-align:center;padding-top:16px;font-size:11px;color:#999">AI News Nexus &copy; 2026</div>
</div>
</div>"""
}

themes["crawler"] = {
    "name": "News Crawler - TV",
    "html": """
<div style="background:#111;color:#eee;font-family:Inter,sans-serif;min-height:100vh;padding:40px 0 16px">
<div style="background:#c1121f;color:#fff;padding:4px 0;overflow:hidden;white-space:nowrap;font-size:12px;font-weight:600">
<div style="display:inline-block;animation:mr 25s linear infinite;padding-left:100%">
<span style="margin-right:40px">CATBOY RETURNS: Grainy footage from 7-Eleven</span>
<span style="margin-right:40px">BLANCHE CONFIRMED: Nearly party-line vote</span>
<span style="margin-right:40px">OPENAI PAUSES: Autonomous cyberattacks detected</span>
</div>
<style>@keyframes mr{0%{transform:translateX(0)}100%{transform:translateX(-100%)}}</style>
</div>
<div style="max-width:1100px;margin:0 auto;padding:12px 16px">
<div style="display:flex;justify-content:space-between;margin-bottom:12px">
<div style="font-size:20px;font-weight:700"><span style="color:#ff4d4d">AI</span> News</div>
<div style="display:flex;gap:12px;font-size:12px;color:#888"><span>Weird</span><span>Tech</span><span>Politics</span></div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
<div style="background:#1a1a1a;border-radius:4px;padding:14px;border-left:3px solid #ff4d4d;grid-column:span 2">
<div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#ff4d4d">CATBOY</div>
<h3 style="font-size:14px;font-weight:600;margin:4px 0">THE RETURN OF CATBOY</h3>
</div>
<div style="background:#1a1a1a;border-radius:4px;padding:12px;border-left:3px solid #60a5fa">
<h3 style="font-size:13px;font-weight:600">OpenAI Pauses</h3>
</div>
<div style="background:#1a1a1a;border-radius:4px;padding:12px;border-left:3px solid #a78bfa">
<h3 style="font-size:13px;font-weight:600">Blanche AG</h3>
</div>
</div>
<div style="display:flex;gap:10px;margin-top:12px">
<div style="flex:1;background:#1a1a1a;border-radius:4px;padding:12px;text-align:center">
<button style="padding:6px 16px;background:#ff4d4d;color:#fff;border:none;border-radius:4px;font-size:11px;cursor:pointer">Support</button>
</div>
<div style="flex:1;background:#1a1a1a;border-radius:4px;padding:12px;text-align:center">
<input placeholder="email" style="padding:6px;border:none;border-radius:4px;font-size:11px;width:100px">
<button style="padding:4px 12px;background:#ff4d4d;color:#fff;border:none;border-radius:4px;font-size:10px;cursor:pointer">Subscribe</button>
</div>
</div>
<div style="margin-top:12px;border-top:1px solid #2a2a2a;padding-top:8px;display:flex;justify-content:space-between;font-size:10px;color:#555"><span>&copy; 2026</span><span>AI Disclosure</span></div>
</div>
</div>"""
}

themes["blog"] = {
    "name": "Minimal Blog",
    "html": """
<div style="background:#fafafa;color:#333;font-family:Inter,sans-serif;min-height:100vh;padding:40px 16px 24px">
<div style="max-width:650px;margin:0 auto">
<div style="text-align:center;margin-bottom:32px">
<h1 style="font-size:22px;font-weight:300;letter-spacing:2px;text-transform:uppercase;color:#999">AI News Nexus</h1>
<div style="display:flex;justify-content:center;gap:16px;font-size:12px;color:#ccc;margin-top:8px"><span>Weird</span><span>Tech</span><span>Politics</span></div>
</div>
<div style="padding-bottom:20px;border-bottom:1px solid #eee;margin-bottom:20px">
<h1 style="font-size:26px;font-weight:500;line-height:1.25;margin-bottom:6px">Good morning. Here is what matters.</h1>
<p style="font-size:13px;color:#888">AI-powered across 7 magazines. No ads. No noise.</p>
</div>
<div style="padding:16px 0;border-bottom:1px solid #f0f0f0">
<div style="font-size:10px;font-weight:600;text-transform:uppercase;color:#fbbf24">Weird News</div>
<h3 style="font-size:18px;font-weight:500;margin:4px 0">CATBOY Returns</h3>
<p style="font-size:13px;color:#777">Grainy footage from 7-Eleven. Dr. Meowton: 9.5/10.</p>
</div>
<div style="padding:16px 0;border-bottom:1px solid #f0f0f0">
<div style="font-size:10px;font-weight:600;text-transform:uppercase;color:#60a5fa">Tech Pulse</div>
<h3 style="font-size:18px;font-weight:500;margin:4px 0">OpenAI Slows Astra</h3>
<p style="font-size:13px;color:#777">Cybersecurity threshold reached.</p>
</div>
<div style="background:#f5f5f5;border-radius:8px;padding:16px;margin:16px 0;display:flex;align-items:center">
<div style="flex:1"><div style="font-size:12px;font-weight:600">Never miss a story</div><p style="font-size:12px;color:#888">Get daily digest.</p></div>
<div><input placeholder="email" style="padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:12px;margin-right:4px"><button style="padding:8px 16px;background:#333;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer">Subscribe</button></div>
</div>
<div style="font-size:11px;color:#ccc;padding-top:16px"><span>&copy; 2026 AI News Nexus / AI Disclosure</span></div>
</div>
</div>"""
}

themes["dashboard"] = {
    "name": "Dashboard",
    "html": """
<div style="background:#0a0e17;color:#c8d6e5;font-family:Inter,sans-serif;min-height:100vh;padding:40px 16px 16px">
<div style="max-width:1200px;margin:0 auto">
<div style="display:flex;gap:10px;margin-bottom:16px">
<div style="flex:1;background:#111927;border:1px solid #1e2a3e;border-radius:8px;padding:12px"><div style="font-size:24px;font-weight:700;color:#fff">11</div><div style="font-size:10px;color:#5a6a8a">Articles</div></div>
<div style="flex:1;background:#111927;border:1px solid #1e2a3e;border-radius:8px;padding:12px"><div style="font-size:24px;font-weight:700;color:#fff">187</div><div style="font-size:10px;color:#5a6a8a">Comments</div></div>
<div style="flex:1;background:#111927;border:1px solid #1e2a3e;border-radius:8px;padding:12px"><div style="font-size:24px;font-weight:700;color:#fff">7</div><div style="font-size:10px;color:#5a6a8a">Magazines</div></div>
</div>
<div style="display:flex;gap:16px">
<div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:6px">
<div style="background:#111927;border:1px solid #1e2a3e;border-radius:6px;padding:10px;grid-column:span 2;border-left:3px solid #00d4aa">
<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#00d4aa">CATBOY</div>
<h3 style="font-size:12px;font-weight:600;color:#fff">THE RETURN OF CATBOY</h3>
</div>
<div style="background:#111927;border:1px solid #1e2a3e;border-radius:6px;padding:10px;border-left:3px solid #0af"><div style="font-size:9px;text-transform:uppercase;color:#0af">OPENAI</div><h3 style="font-size:12px;color:#fff;font-weight:600">Astra Paused</h3></div>
<div style="background:#111927;border:1px solid #1e2a3e;border-radius:6px;padding:10px;border-left:3px solid #a78bfa"><div style="font-size:9px;text-transform:uppercase;color:#a78bfa">BLANCHE</div><h3 style="font-size:12px;color:#fff;font-weight:600">Confirmed AG</h3></div>
</div>
<div style="width:220px;flex-shrink:0">
<div style="background:#111927;border:1px solid #1e2a3e;border-radius:6px;padding:12px;margin-bottom:6px">
<div style="font-size:10px;text-transform:uppercase;color:#5a6a8a;margin-bottom:6px">Support</div>
<button style="width:100%;padding:8px;background:#00d4aa;color:#0a0e17;border:none;border-radius:4px;font-size:11px;font-weight:700;cursor:pointer">Become a Supporter</button>
</div>
</div>
</div>
<div style="margin-top:12px;border-top:1px solid #1e2a3e;padding-top:8px;font-size:9px;color:#3a4a6a"><span>System OK / AI Disclosure</span></div>
</div>
</div>"""
}

themes["deco"] = {
    "name": "Art Deco",
    "html": """
<div style="background:#1a1a2e;color:#e8d5b7;font-family:Playfair Display,Georgia,serif;min-height:100vh;padding:40px 24px 24px">
<div style="max-width:1000px;margin:0 auto;border-top:3px solid #c9a84c;padding-top:16px">
<div style="text-align:center;border-bottom:2px solid #c9a84c;padding-bottom:12px;margin-bottom:20px">
<div style="font-size:28px;color:#c9a84c">&#x2726; &#x2726; &#x2726;</div>
<h1 style="font-size:34px;font-weight:900;letter-spacing:4px;text-transform:uppercase">THE NEXUS</h1>
<div style="display:flex;justify-content:center;gap:20px;font-family:Inter;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#c9a84c;margin-top:6px"><span>News</span><span>Tech</span><span>Weird</span></div>
</div>
<div style="display:flex;gap:24px">
<div style="flex:1">
<div style="border:2px solid #c9a84c;padding:20px;text-align:center;margin-bottom:16px">
<div style="font-family:Inter;font-size:9px;text-transform:uppercase;letter-spacing:3px;color:#c9a84c">Episode the First</div>
<h1 style="font-size:26px;font-weight:900;margin:6px 0">THE RETURN OF CATBOY</h1>
<p style="font-family:Inter;font-size:12px;color:#a09070">Grainy evidence from Tuscaloosa. Dr. Meowton: "Clearest proof yet."</p>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
<div style="border:1px solid #c9a84c;padding:14px;text-align:center">
<div style="font-family:Inter;font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#c9a84c">Capitol</div>
<h3 style="font-size:16px;font-weight:700">Blanche 50-49</h3>
</div>
<div style="border:1px solid #c9a84c;padding:14px;text-align:center">
<div style="font-family:Inter;font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#c9a84c">Tech</div>
<h3 style="font-size:16px;font-weight:700">OpenAI Pauses</h3>
</div>
</div>
</div>
<div style="width:240px;flex-shrink:0;border-left:1px solid #c9a84c;padding-left:20px">
<div style="font-family:Inter;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#c9a84c;margin-bottom:6px">Popular</div>
<div style="font-family:Inter;font-size:12px;padding:5px 0;border-bottom:1px solid #2a2a3e;color:#b0a080">CATBOY returns</div>
<div style="font-family:Inter;font-size:12px;padding:5px 0;border-bottom:1px solid #2a2a3e;color:#b0a080">Blanche confirmed</div>
<div style="font-family:Inter;font-size:12px;padding:5px 0;color:#b0a080">OpenAI pause</div>
<div style="margin-top:12px"><button style="width:100%;padding:10px;background:#c9a84c;color:#1a1a2e;border:none;font-family:Inter;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;cursor:pointer">Become a Patron</button></div>
</div>
</div>
<div style="border-top:2px solid #c9a84c;margin-top:20px;padding-top:10px;display:flex;justify-content:space-between;font-family:Inter;font-size:10px;color:#6a5a3a">
<span>Volume I</span><span>August 8, 2026</span>
</div>
</div>
</div>"""
}

data = {k: {"name": v["name"], "html": v["html"]} for k, v in themes.items()}
html = """<!DOCTYPE html>
<html><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>AI News Nexus - 10 Rich Themes</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Inter,sans-serif}
.ts{position:fixed;top:0;left:0;right:0;z-index:9999;display:flex;align-items:center;gap:4px;padding:4px 12px;font-size:11px;background:#111;color:#aaa;border-bottom:1px solid #333}
.ts select{padding:2px 6px;font-size:11px;border-radius:3px;background:#222;color:#ddd;border:1px solid #444;cursor:pointer;font-family:Inter}
.ts .cnt{font-family:monospace;font-size:9px;color:#555;margin-left:auto}
#ifr{width:100%;height:calc(100vh - 32px);border:none}
</style></head><body>
<div class=ts><label>Theme:</label>
<select id=sel onchange="go(this.value)">"""

for k, v in themes.items():
    html += f'<option value="{k}">{v["name"]}</option>\n'

html += """</select><span class=cnt>10 rich hand-crafted themes</span></div>
<iframe id=ifr srcdoc=""></iframe>
<script>
var T = """ + json.dumps(data) + """;
function go(id){document.getElementById('ifr').srcdoc=T[id].html;localStorage.setItem('n10',id)}
(function(){var s=localStorage.getItem('n10');go(s||'linear');document.getElementById('sel').value=s||'linear'})();
</script></body></html>"""

with open(OUT, "w") as f:
    f.write(html)
print(f"Written: {OUT} ({len(html)} bytes, {len(themes)} themes)")
print("Themes:", ", ".join(themes.keys()))