#!/usr/bin/env python3
"""Generate a unified theme demo page with 20 themes defined as data."""
import json, os, html as html_mod

OUT = "/home/todd/ai-news-nexus/frontend/public/themes.html"

themes = json.loads(open("/home/todd/ai-news-nexus/frontend/public/themes.json").read())

# Build HTML page
page = """<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI News Nexus - Theme Generator</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Inter,sans-serif;transition:none}
.ts{position:fixed;top:0;left:0;right:0;z-index:9999;display:flex;align-items:center;gap:6px;padding:4px 12px;font-size:11px;background:#111;color:#aaa;border-bottom:1px solid #333}
.ts select{padding:2px 6px;font-size:11px;border-radius:3px;background:#222;color:#ddd;border:1px solid #444;cursor:pointer;font-family:Inter}
.ts .cnt{font-family:monospace;font-size:9px;color:#555;margin-left:auto}
#content{max-width:1100px;margin:0 auto;padding:40px 16px 16px}
</style>
</head><body>
<div class="ts"><label>Theme:</label>
<select id="sel">"""

for i, t in enumerate(themes):
    page += f'<option value="{i}">{t["name"]}</option>\n'

page += """</select><span class="cnt">20 themes - data driven</span></div>
<div id="content"></div>
<script>
const themes = """ + json.dumps(themes) + """;

function apply(id){
  const t = themes[id];
  const c = document.getElementById('content');
  const bg = t.colors.bg;
  
  // Apply to body
  document.body.style.background = bg === 'gradient' ? 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' : 
                                  bg === 'gradient-warm' ? 'linear-gradient(135deg,#fef9ef,#fdf2e9,#fef9ef)' : bg;
  document.body.style.color = t.colors.text;
  document.body.style.fontFamily = t.font.family;
  
  // Build HTML based on layout type
  let html = '';
  const a = t.articles || 10;
  
  // Header
  html += '<header style="padding:12px 0;margin-bottom:16px;border-bottom:1px solid ' + t.colors.border + '">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center">';
  html += '<div style="font-size:18px;font-weight:700"><span style="color:' + t.colors.accent + '">AI</span> News Nexus</div>';
  html += '<nav style="display:flex;gap:14px;font-size:12px;color:' + t.colors.text2 + '"><span>Weird</span><span>Tech</span><span>Politics</span><span>Climate</span></nav>';
  html += '</div></header>';
  
  // Layout-specific content
  if(t.layout === 'sidebar-left'){
    html += '<div class="flex" style="display:flex;gap:24px">';
    html += '<aside style="width:200px;flex-shrink:0"><div style="padding:12px;background:' + t.colors.surface + ';border:1px solid ' + t.colors.border + ';border-radius:' + t.radius + '">';
    html += '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:' + t.colors.accent + ';margin-bottom:8px">Streams</div>';
    html += '<div style="font-size:12px;padding:6px 0;border-bottom:1px solid ' + t.colors.border + '">Weird News</div>';
    html += '<div style="font-size:12px;padding:6px 0;border-bottom:1px solid ' + t.colors.border + '">Tech Pulse</div>';
    html += '<div style="font-size:12px;padding:6px 0;border-bottom:1px solid ' + t.colors.border + '">Poli Split</div>';
    html += '<div style="font-size:12px;padding:6px 0">Climate Watch</div>';
    html += '</div></aside><main style="flex:1">';
    html += renderArticles(t, a);
    html += '</main></div>';
  }
  else if(t.layout === 'sidebar-right'){
    html += '<div class="flex" style="display:flex;gap:24px">';
    html += '<main style="flex:1">' + renderArticles(t, a) + '</main>';
    html += '<aside style="width:240px;flex-shrink:0">';
    html += '<div style="padding:14px;background:' + t.colors.surface + ';border:1px solid ' + t.colors.border + ';border-radius:' + t.radius + ';margin-bottom:10px">';
    html += '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:' + t.colors.accent + ';margin-bottom:6px">Trending</div>';
    html += '<div style="font-size:12px;padding:5px 0;border-bottom:1px solid ' + t.colors.border + '">CATBOY sighting</div>';
    html += '<div style="font-size:12px;padding:5px 0;border-bottom:1px solid ' + t.colors.border + '">Blanche confirmed</div>';
    html += '<div style="font-size:12px;padding:5px 0">OpenAI pause</div>';
    html += '</div>';
    html += '<div style="padding:14px;background:' + t.colors.surface + ';border:1px solid ' + t.colors.border + ';border-radius:' + t.radius + '">';
    html += '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:' + t.colors.accent + ';margin-bottom:6px">Newsletter</div>';
    html += '<input placeholder="your@email.com" style="width:100%;padding:6px 10px;background:' + t.colors.bg + ';border:1px solid ' + t.colors.border + ';border-radius:4px;color:' + t.colors.text + ';font-size:11px;font-family:inherit;margin-bottom:4px">';
    html += '<button style="width:100%;padding:6px;background:' + t.colors.accent + ';color:white;border:none;border-radius:4px;font-size:11px;font-weight:500;cursor:pointer">Subscribe</button>';
    html += '</div></aside></div>';
  }
  // ... more layouts would go here
  else {
    html += renderArticles(t, a);
  }
  
  // Footer
  html += '<footer style="margin-top:24px;padding-top:12px;border-top:1px solid ' + t.colors.border + ';display:flex;justify-content:space-between;font-size:10px;color:' + t.colors.text3 + '">';
  html += '<span>&copy; 2026 AI News Nexus</span><span>' + t.name + '</span></footer>';
  
  c.innerHTML = html;
  localStorage.setItem('thm', id);
}

function renderArticles(t, n){
  let h = '<div style="margin-bottom:20px">';
  h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">';
  h += '<span style="width:8px;height:8px;border-radius:50%;background:' + t.colors.accent + ';display:inline-block"></span>';
  h += '<h2 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:' + t.colors.text2 + '">Weekly Weird News</h2></div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';
  h += card(t, "🐱", "THE RETURN OF CATBOY: Half-Cat Cryptid at 7-Eleven", "Grainy security footage. Dr. Meowton rates 9.5/10. Witnesses describe Slurpee purchase.", t.colors.accent, true);
  h += card(t, "👽", "Local Man's Shed Contains UFO Since 1998", 'Authorities say "please stop calling." Owner insists it is not for sale.', t.colors.accent);
  h += card(t, "🔬", "OpenAI Slows Astra Development Over Security Fears", "Model demonstrated autonomous cyberattack capabilities on protected government systems.", t.colors.accent);
  h += card(t, "🏛️", "Blanche Confirmed as Attorney General in 50-49 Vote", "Nearly party-line vote confirms Trump's former personal attorney as top law enforcement official.", t.colors.accent);
  h += '</div></div>';
  
  h += '<div style="margin-bottom:20px">';
  h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">';
  h += '<span style="width:8px;height:8px;border-radius:50%;background:' + t.colors.accent + ';display:inline-block"></span>';
  h += '<h2 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:' + t.colors.text2 + '">Tech Pulse</h2></div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';
  h += card(t, "💰", "Nvidia to Invest $3 Billion in Stargate Data Center", "Funding supports massive AI infrastructure campus expansion in Texas.", t.colors.accent);
  h += card(t, "🌐", "Cloudflare Launches Kitesurf Browser for AI Agents", "Specialized browser designed to support and secure autonomous AI agent operations.", t.colors.accent);
  h += '</div></div>';
  
  h += '<div style="margin-bottom:20px">';
  h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">';
  h += '<span style="width:8px;height:8px;border-radius:50%;background:' + t.colors.accent + ';display:inline-block"></span>';
  h += '<h2 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:' + t.colors.text2 + '">Poli Split</h2></div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';
  h += card(t, "🔵", "Democrats Warn of Unprecedented DOJ Power Consolidation", '"This is a dark day for judicial independence," says Senate Minority Leader.', t.colors.accent);
  h += card(t, "🔴", "Conservatives Celebrate Blanche Confirmation as AG", "Supporters say his record proves he will restore integrity to the Justice Department.", t.colors.accent);
  h += '</div></div>';
  
  return h;
}

function card(t, emoji, title, desc, accent, featured){
  let border = featured ? 'border-left:3px solid ' + accent + ';' : '';
  let bg = t.cardStyle === 'outlined' ? t.colors.card + ';border:1px solid ' + t.colors.border :
           t.cardStyle === 'shadow' ? t.colors.card + ';box-shadow:0 2px 8px rgba(0,0,0,0.06)' :
           t.cardStyle === 'glass' ? 'rgba(255,255,255,0.05);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1)' :
           t.cardStyle === 'pin' ? t.colors.card + ';transform:rotate(' + (Math.random()*3-1.5).toFixed(1) + 'deg);box-shadow:2px 3px 6px rgba(0,0,0,0.2)' :
           t.cardStyle === 'player' ? t.colors.card + ';border:1px solid ' + t.colors.border + ';display:flex;align-items:center;gap:12px' :
           t.colors.card + ';border:1px solid ' + t.colors.border;
  return '<div style="background:' + bg + ';border-radius:' + t.radius + ';padding:14px;cursor:pointer;' + border + 'margin-bottom:6px">' +
    (t.cardStyle === 'player' ? renderPlayer(t, emoji, title) : renderDefault(t, emoji, title, desc)) +
    '</div>';
}

function renderDefault(t, emoji, title, desc){
  return '<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">' + emoji + '</div>' +
    '<h3 style="font-size:13px;font-weight:600;line-height:1.3;margin-bottom:2px">' + title + '</h3>' +
    '<p style="font-size:11px;color:' + t.colors.text2 + ';line-height:1.4">' + desc + '</p>';
}

function renderPlayer(t, emoji, title){
  return '<div style="display:flex;align-items:center;gap:10px;width:100%">' +
    '<div style="width:36px;height:36px;border-radius:8px;background:' + t.colors.accent + ';display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">' + emoji + '</div>' +
    '<div style="flex:1"><div style="font-size:10px;color:' + t.colors.text2 + '">Now Playing</div><h3 style="font-size:13px;font-weight:600">' + title + '</h3></div>' +
    '<div style="font-size:18px;color:' + t.colors.accent + ';cursor:pointer">&#9654;</div></div>';
}

// Apply default on load
(function(){
  const s = localStorage.getItem('thm');
  const sel = document.getElementById('sel');
  sel.addEventListener('change', function(){ apply(parseInt(this.value)); });
  apply(s ? parseInt(s) : 0);
  if(s) sel.value = s;
})();
</script>
</body></html>
"""

with open(OUT, 'w') as f:
    f.write(page)
print(f"Written: {OUT} ({len(page)} bytes)")