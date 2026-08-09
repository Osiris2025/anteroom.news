// @ts-nocheck  -- ported from nexus_template.html working theme generator.
// AUTO-GENERATED from nexus_template.html (working theme generator).
// Each theme carries a structural spec + its own full CSS stylesheet.
// The shared renderTemplate consumes the structure; theme CSS feeds into
// the rendered HTML. CSS is never inline in the markup.

export interface Theme {
  id: string; name: string; structure: any; css: string;
}

export const themes: Theme[] = [
  { id:"linear", name:"Linear \u2014 Dark Precision", structure: {layout:"sidebar-left", sidebar:["nav","subscribe"], showPoll:false, showQuiz:false, showCrawl:false, showStats:false, footer:"minimal"}, css: `
      body{background:#08090a;color:#f7f8f8}
      .header{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.06)}
      .brand{font-size:17px;font-weight:700;color:#f7f8f8}
      .brand i{color:#7170ff;font-style:normal}
      .nav{display:flex;gap:18px}
      .nav a{color:#8a8f98;font-size:13px;text-decoration:none}
      .nav a.on{color:#f7f8f8}
      .grid{display:grid;grid-template-columns:230px 1fr;gap:32px;max-width:1160px;margin:0 auto;padding:24px 20px}
      .side{display:flex;flex-direction:column;gap:18px}
      .sitem{padding:9px 12px;border-radius:6px;font-size:13px;color:#8a8f98}
      .sitem.on{background:rgba(255,255,255,0.05);color:#f7f8f8}
      .panel{background:#0f1011;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:14px}
      .panel h4{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#62666d;margin-bottom:8px}
      .panel input{width:100%;padding:8px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:6px;color:#f7f8f8;font-size:12px;margin-bottom:6px}
      .btn{width:100%;padding:8px;background:#5e6ad2;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer}
      .mast{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:12px;margin-bottom:18px}
      .mast h1{font-size:28px;font-weight:600;letter-spacing:-0.7px}
      .mast p{color:#62666d;font-size:13px}
      .sec{margin-bottom:22px}
      .sec-t{display:flex;align-items:center;gap:8px;margin-bottom:10px}
      .sec-t .dot{width:8px;height:8px;border-radius:50%;background:var(--accent,#7170ff)}
      .sec-t h2{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#62666d;font-weight:600}
      .cards{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .card{background:#0f1011;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:14px}
      .card .k{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--accent,#7170ff);margin-bottom:4px}
      .card h3{font-size:13px;font-weight:500;line-height:1.3;margin-bottom:3px}
      .card p{font-size:11px;color:#8a8f98;line-height:1.4}
      .foot{margin-top:28px;border-top:1px solid rgba(255,255,255,0.06);padding:14px 20px;display:flex;justify-content:space-between;font-size:10px;color:#62666d}
    ` },
  { id:"vercel", name:"Vercel \u2014 White Minimal", structure: {layout:"sidebar-left", sidebar:["nav","subscribe"], showPoll:false, showQuiz:false, showCrawl:false, showStats:false, footer:"minimal"}, css: `
      body{background:#fff;color:#171717}
      .header{display:flex;justify-content:space-between;align-items:center;padding:14px 20px}
      .brand{font-size:17px;font-weight:600;color:#171717}
      .brand i{color:#0072f5;font-style:normal}
      .nav{display:flex;gap:18px}
      .nav a{color:#666;font-size:13px;text-decoration:none}
      .nav a.on{color:#171717}
      .grid{display:grid;grid-template-columns:230px 1fr;gap:40px;max-width:1160px;margin:0 auto;padding:24px 20px}
      .side{display:flex;flex-direction:column;gap:18px}
      .sitem{padding:8px 0;font-size:13px;color:#666;border-bottom:1px solid #f0f0f0}
      .sitem.on{color:#171717;font-weight:500}
      .panel{padding:0}
      .panel h4{font-size:11px;color:#666;margin-bottom:6px;font-weight:600}
      .panel input{width:100%;padding:8px;font-size:12px;border:0;box-shadow:0 0 0 1px rgba(0,0,0,0.08);border-radius:6px;margin-bottom:6px}
      .btn{width:100%;padding:8px;background:#171717;color:#fff;border:0;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;box-shadow:0 0 0 1px rgba(0,0,0,0.08)}
      .mast{padding:18px 0;border-bottom:1px solid #f0f0f0;margin-bottom:18px}
      .mast h1{font-size:32px;font-weight:600;letter-spacing:-1.6px;line-height:1.05}
      .mast p{color:#666;font-size:14px}
      .sec{margin-bottom:22px}
      .sec-t{display:flex;align-items:center;gap:8px;margin-bottom:10px}
      .sec-t .dot{width:8px;height:8px;border-radius:50%;background:var(--accent,#0072f5)}
      .sec-t h2{font-size:13px;font-weight:600;color:#171717}
      .cards{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .card{padding:14px;border-radius:6px;box-shadow:0 0 0 1px rgba(0,0,0,0.08),0 2px 2px rgba(0,0,0,0.04),#fafafa 0 0 0 1px}
      .card .k{font-size:10px;font-weight:600;color:var(--accent,#0072f5);margin-bottom:3px}
      .card h3{font-size:14px;font-weight:600;letter-spacing:-0.3px;margin-bottom:2px}
      .card p{font-size:12px;color:#666;line-height:1.4}
      .foot{margin-top:28px;border-top:1px solid #f0f0f0;padding:14px 20px;display:flex;justify-content:space-between;font-size:11px;color:#999}
    ` },
  { id:"tabloid", name:"Tabloid \u2014 Newspaper", structure: {layout:"sidebar-right", showCrawl:true, crawlText:"CATBOY RETURNS · BLANCHE 50-49 · OPENAI PAUSES · NVIDIA \$3B", sidebar:["nav","support"], showPoll:true, showQuiz:false, showStats:false, footer:"newspaper"}, css: `
        body{background:#f6efe0;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif}
        .crawl{background:#1a1a1a;color:#ffe14d;text-align:center;padding:6px;font-weight:900;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-family:'Arial Black','Arial Narrow',Arial,sans-serif}
        .header{border-bottom:4px solid #1a1a1a;padding:10px 20px}
        .brand{text-align:center;font-size:40px;font-weight:900;letter-spacing:-1px;text-transform:uppercase;font-family:'Arial Black','Arial Narrow',Arial,sans-serif}
        .brand i{color:#c1121f;font-style:normal}
        .brand small{display:block;font-family:Georgia,serif;font-size:11px;text-transform:uppercase;letter-spacing:4px;color:#1a1a1a;font-weight:400}
        .nav{display:flex;justify-content:center;gap:22px;margin-top:6px;text-transform:uppercase;letter-spacing:1px;font-family:Georgia,serif;font-size:11px}
        .nav a{color:#1a1a1a;text-decoration:none;font-weight:700}
        .grid{display:grid;grid-template-columns:1fr 250px;gap:24px;max-width:1000px;margin:0 auto;padding:20px}
        .side{border-left:3px solid #1a1a1a;padding-left:18px;display:flex;flex-direction:column;gap:14px}
        .sitem{font-family:Georgia,serif;font-size:12px;color:#333;padding:6px 0;border-bottom:1px solid #d8cfbb;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
        .panel h4{font-family:'Arial Black',Arial,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#c1121f;border-bottom:2px solid #1a1a1a;padding-bottom:4px;margin-bottom:6px}
        .btn{width:100%;padding:9px;background:#c1121f;color:#fff;border:2px solid #1a1a1a;font-family:'Arial Black',Arial,sans-serif;font-weight:700;font-size:12px;cursor:pointer;text-transform:uppercase}
        .mast{border-bottom:3px solid #c1121f;padding-bottom:12px;margin-bottom:16px;text-align:center}
        .mast h1{font-size:44px;font-weight:900;line-height:.95;text-transform:uppercase;font-family:'Arial Black','Arial Narrow',Arial,sans-serif;letter-spacing:-1px}
        .mast h1 small{display:block;font-family:Georgia,serif;font-style:italic;text-transform:lowercase;letter-spacing:0;font-size:14px;font-weight:400}
        .mast p{font-family:Georgia,serif;font-size:13px;color:#333;margin-top:6px}
        .sec{margin-bottom:18px}
        .sec-t{border-bottom:2px solid #1a1a1a;padding-bottom:4px;margin-bottom:10px}
        .sec-t h2{font-family:'Arial Black',Arial,sans-serif;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#1a1a1a}
        .card{border-bottom:3px double #1a1a1a;padding:12px 0;display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .card .k{background:#ffe14d;color:#1a1a1a;font-family:'Arial Black',Arial,sans-serif;font-size:10px;text-transform:uppercase;letter-spacing:1px;padding:2px 4px;display:inline-block;margin-bottom:4px}
        .card h3{font-size:19px;font-weight:900;line-height:1.05;text-transform:uppercase;font-family:'Arial Narrow','Arial Black',Arial,sans-serif}
        .card p{font-family:Georgia,serif;font-size:12px;color:#333}
        .foot{border-top:3px solid #1a1a1a;margin-top:18px;padding:10px 20px;display:flex;justify-content:space-between;font-family:Georgia,serif;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:1px}
      ` },
  { id:"magazine", name:"Magazine Glow", structure: {layout:"center", sidebar:null, showPoll:false, showQuiz:false, showCrawl:false, showStats:false, showSupport:true, footer:"minimal"}, css: `
      body{background:#fff;color:#1a1a1a;font-family:'Space Grotesk',sans-serif}
      .header{text-align:center;padding:14px 20px;border-bottom:1px solid #eee}
      .brand{font-size:22px;font-weight:700;background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
      .brand i{font-style:normal}
      .nav{display:flex;justify-content:center;gap:18px;margin-top:6px;font-size:12px;color:#666}
      .nav a{color:#666;text-decoration:none}
      .grid{max-width:920px;margin:0 auto;padding:20px}
      .hero{background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;border-radius:16px;padding:24px;margin-bottom:16px}
      .hero h1{font-size:28px;font-weight:700;line-height:1.1;margin-bottom:6px}
      .hero p{font-size:13px;opacity:0.8;line-height:1.5}
      .sec{margin-bottom:16px}
      .sec-t{display:flex;align-items:center;gap:8px;margin-bottom:10px}
      .sec-t .dot{width:8px;height:8px;border-radius:50%;background:var(--accent,#667eea)}
      .sec-t h2{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#667eea;font-weight:700}
      .cards{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .card{background:#f8f9fa;border-radius:12px;padding:18px}
      .card .k{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#667eea;margin-bottom:4px}
      .card h3{font-size:15px;font-weight:600;margin-bottom:2px}
      .card p{font-size:12px;color:#666;line-height:1.4}
      .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
      .panel{background:#f8f9fa;border-radius:12px;padding:14px;text-align:center}
      .panel h4{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#667eea;margin-bottom:6px}
      .btn{padding:8px 20px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer}
      .foot{border-top:1px solid #eee;margin-top:16px;padding:10px 20px;display:flex;justify-content:space-between;font-size:11px;color:#999}
    ` },
  { id:"terminal", name:"Terminal Hacker", structure: {layout:"full", sidebar:null, showCrawl:false, showPoll:false, showQuiz:false, showStats:true, footer:"terminal"}, css: `
      body{background:#000;color:#0f0;font-family:'IBM Plex Mono',monospace}
      .frame{border:2px solid #0f0;max-width:820px;margin:20px auto;padding:16px;position:relative}
      .frame::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,255,0,0.03) 50%,transparent 50%);background-size:100% 4px;pointer-events:none;animation:scan 2s linear infinite}
      @keyframes scan{0%{transform:translateY(0)}100%{transform:translateY(4px)}}
      .header{text-align:center;border-bottom:1px solid #0f0;padding-bottom:6px;margin-bottom:10px}
      .brand{font-size:10px;letter-spacing:4px;text-transform:uppercase}
      .brand i{font-style:normal;color:#0f0}
      .nav{font-size:8px;color:#060;margin-top:2px}
      .mast{color:#ff0;margin-bottom:6px}
      .mast h1{font-size:15px;font-weight:700;color:#0f0;margin:2px 0}
      .mast p{color:#0a0}
      .sec{margin-bottom:8px;padding-left:16px;border-left:2px solid #0f0}
      .sec-t{margin-bottom:4px}
      .sec-t h2{color:#ff0;font-size:13px}
      .card{border-bottom:1px solid #0f0;padding:6px 0}
      .card h3{font-size:13px;font-weight:700;color:#0f0}
      .card p{font-size:11px;color:#0a0}
      .stats{display:flex;gap:20px;font-size:10px;color:#0a0;margin-bottom:10px}
      .foot{border-top:1px solid #0f0;padding-top:6px;display:flex;justify-content:space-between;font-size:10px;color:#060}
    ` },
  { id:"cardwall", name:"Card Wall \u2014 Masonry", structure: {layout:"masonry", sidebar:null, showCrawl:false, showPoll:true, showQuiz:true, showStats:false, showSupport:true, footer:"minimal"}, css: `
      body{background:#f0f2f5;color:#1a1a2e;font-family:Inter,sans-serif}
      .header{text-align:center;padding:14px 20px}
      .brand{font-size:24px;font-weight:800;letter-spacing:-0.5px}
      .brand i{color:#667eea;font-style:normal}
      .nav{display:flex;justify-content:center;gap:18px;margin-top:6px;font-size:12px;color:#666}
      .nav a{color:#666;text-decoration:none}
      .grid{column-count:3;column-gap:14px;max-width:1020px;margin:0 auto;padding:20px}
      .card,.panel,.hero,.mast{break-inside:avoid;margin-bottom:14px;display:inline-block;width:100%}
      .hero{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border-radius:16px;padding:24px}
      .hero h1{font-size:20px;font-weight:700;margin-top:4px}
      .mast{background:#fff;border-radius:16px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06)}
      .card{background:#fff;border-radius:16px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06)}
      .card .k{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#667eea;font-weight:700;margin-bottom:3px}
      .card h3{font-size:16px;font-weight:700;margin-bottom:2px;line-height:1.2}
      .panel{background:#fff;border-radius:16px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06)}
      .panel h4{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#667eea;font-weight:700;margin-bottom:6px}
      .btn{width:100%;padding:8px;background:#1a1a2e;color:#fff;border:none;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer}
      .btn-line{padding:6px 12px;border:1px solid #e0e0e0;border-radius:8px;background:#f8f8f8;font-size:12px;cursor:pointer;margin-right:4px}
      .foot{text-align:center;padding:16px;font-size:11px;color:#999}
    ` },
  { id:"crawler", name:"News Crawler \u2014 TV", structure: {layout:"grid", showCrawl:true, crawlText:"CATBOY RETURNS · BLANCHE 50-49 · OPENAI PAUSES · NVIDIA \$3B · KITESURF", sidebar:null, showPoll:false, showQuiz:false, showStats:false, showSupport:true, footer:"minimal"}, css: `
      body{background:#111;color:#eee;font-family:Inter,sans-serif}
      .crawl{background:#c1121f;color:#fff;padding:5px;font-size:12px;font-weight:600;overflow:hidden;white-space:nowrap}
      .crawl::after{content:"";display:inline-block;animation:marq 25s linear infinite}
      .header{display:flex;justify-content:space-between;align-items:center;padding:12px 20px}
      .brand{font-size:20px;font-weight:700}
      .brand i{color:#ff4d4d;font-style:normal}
      .nav{display:flex;gap:12px;font-size:12px;color:#888}
      .grid{max-width:1100px;margin:0 auto;padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .card{background:#1a1a1a;border-radius:4px;padding:12px;border-left:3px solid var(--accent,#ff4d4d)}
      .card.wide{grid-column:span 2}
      .card .k{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--accent,#ff4d4d);margin-bottom:3px}
      .card h3{font-size:13px;font-weight:600}
      .card p{font-size:11px;color:#888}
      .foot-row{max-width:1100px;margin:12px auto;display:flex;gap:10px;padding:0 16px}
      .panel{flex:1;background:#1a1a1a;border-radius:4px;padding:10px;text-align:center}
      .btn{padding:8px 20px;background:#ff4d4d;color:#fff;border:none;border-radius:4px;font-size:12px;font-weight:600;cursor:pointer}
      .foot{border-top:1px solid #2a2a2a;margin-top:12px;padding:8px 20px;display:flex;justify-content:space-between;font-size:10px;color:#555}
    ` },
  { id:"blog", name:"Minimal Blog", structure: {layout:"single", sidebar:null, showCrawl:false, showPoll:false, showQuiz:false, showStats:false, showSubscribe:true, footer:"minimal"}, css: `
      body{background:#fafafa;color:#333;font-family:Inter,sans-serif}
      .header{text-align:center;padding:30px 20px}
      .brand{font-size:22px;font-weight:300;text-transform:uppercase;letter-spacing:2px;color:#999}
      .brand i{font-style:normal}
      .nav{display:flex;justify-content:center;gap:16px;margin-top:8px;font-size:12px;color:#ccc}
      .nav a{color:#ccc;text-decoration:none}
      .grid{max-width:650px;margin:0 auto;padding:20px}
      .mast{border-bottom:1px solid #eee;padding-bottom:20px;margin-bottom:10px}
      .mast h1{font-size:26px;font-weight:500;line-height:1.25;margin-bottom:6px}
      .mast p{font-size:13px;color:#888;line-height:1.5}
      .card{padding:16px 0;border-bottom:1px solid #f0f0f0}
      .card .k{font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
      .card h3{font-size:18px;font-weight:500;line-height:1.2;margin-bottom:3px}
      .card p{font-size:13px;color:#777;line-height:1.5}
      .card .t{font-size:11px;color:#bbb;margin-top:3px}
      .subscribe{background:#f5f5f5;border-radius:8px;padding:16px;margin:16px 0;display:flex;align-items:center;gap:16px}
      .subscribe h4{font-size:12px;font-weight:600;margin-bottom:2px}
      .subscribe p{font-size:12px;color:#888}
      .subscribe input{padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:12px}
      .btn{padding:8px 16px;background:#333;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer}
      .foot{border-top:1px solid #f0f0f0;margin-top:16px;padding:10px 20px;display:flex;justify-content:space-between;font-size:11px;color:#ccc}
    ` },
  { id:"dashboard", name:"Dashboard", structure: {layout:"sidebar-right", sidebar:["nav","support"], showCrawl:false, showPoll:false, showQuiz:false, showStats:true, footer:"minimal"}, css: `
      body{background:#0a0e17;color:#c8d6e5;font-family:Inter,sans-serif}
      .header{display:flex;justify-content:space-between;align-items:center;padding:12px 20px}
      .brand{font-size:18px;font-weight:700}
      .brand i{color:#00d4aa;font-style:normal}
      .nav{display:flex;gap:10px;font-size:10px;color:#5a6a8a;text-transform:uppercase;letter-spacing:1px}
      .stats{display:flex;gap:10px;max-width:1200px;margin:0 auto;padding:0 20px 16px}
      .stat{flex:1;background:#111927;border:1px solid #1e2a3e;border-radius:8px;padding:12px}
      .stat b{font-size:24px;color:#fff;display:block}
      .stat span{font-size:10px;color:#5a6a8a}
      .grid{display:grid;grid-template-columns:1fr 240px;gap:16px;max-width:1200px;margin:0 auto;padding:0 20px}
      .cards{display:grid;grid-template-columns:1fr 1fr;gap:6px}
      .card{background:#111927;border:1px solid #1e2a3e;border-radius:6px;padding:10px;border-left:3px solid var(--accent,#00d4aa)}
      .card.wide{grid-column:span 2}
      .card .k{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--accent,#00d4aa);margin-bottom:2px}
      .card h3{font-size:12px;font-weight:600;color:#fff}
      .card p{font-size:10px;color:#5a6a8a}
      .side{display:flex;flex-direction:column;gap:8px}
      .panel{background:#111927;border:1px solid #1e2a3e;border-radius:6px;padding:12px}
      .panel h4{font-size:10px;text-transform:uppercase;color:#5a6a8a;margin-bottom:6px}
      .sitem{font-size:11px;padding:4px 0;border-bottom:1px solid #1a2438;color:#c8d6e5}
      .btn{width:100%;padding:8px;background:#00d4aa;color:#0a0e17;border:none;border-radius:4px;font-size:11px;font-weight:700;cursor:pointer}
      .foot{border-top:1px solid #1e2a3e;margin-top:16px;padding:10px 20px;display:flex;justify-content:space-between;font-size:9px;color:#3a4a6a}
    ` },
  { id:"deco", name:"Art Deco", structure: {layout:"sidebar-right", sidebar:["nav","support"], showCrawl:false, showPoll:false, showQuiz:false, showStats:false, footer:"newspaper"}, css: `
      body{background:#1a1a2e;color:#e8d5b7;font-family:'Playfair Display',Georgia,serif}
      .shell{border-top:3px solid #c9a84c;max-width:1000px;margin:20px auto;padding-top:16px}
      .header{text-align:center;border-bottom:2px solid #c9a84c;padding-bottom:12px;margin-bottom:20px}
      .brand{font-size:34px;font-weight:900;letter-spacing:4px;text-transform:uppercase}
      .brand i{color:#c9a84c;font-style:normal}
      .orn{font-size:28px;color:#c9a84c}
      .nav{display:flex;justify-content:center;gap:20px;font-family:Inter;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#c9a84c;margin-top:6px}
      .grid{display:grid;grid-template-columns:1fr 240px;gap:24px;padding:0 20px}
      .mast{border:2px solid #c9a84c;padding:20px;margin-bottom:16px;text-align:center}
      .mast h1{font-size:26px;font-weight:900;line-height:1.1;margin:6px 0}
      .mast p{font-family:Inter;font-size:12px;color:#a09070}
      .cards{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .card{border:1px solid #c9a84c;padding:14px;text-align:center}
      .card .k{font-family:Inter;font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#c9a84c;margin-bottom:4px}
      .card h3{font-size:16px;font-weight:700;line-height:1.15}
      .card p{font-family:Inter;font-size:10px;color:#a09070}
      .side{border-left:1px solid #c9a84c;padding-left:20px}
      .sitem{font-family:Inter;font-size:12px;padding:5px 0;border-bottom:1px solid #2a2a3e;color:#b0a080}
      .panel h4{font-family:Inter;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#c9a84c;margin-bottom:6px}
      .btn{width:100%;padding:10px;background:#c9a84c;color:#1a1a2e;border:none;font-family:Inter;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;cursor:pointer}
      .foot{border-top:2px solid #c9a84c;margin-top:20px;padding:10px 20px;display:flex;justify-content:space-between;font-family:Inter;font-size:10px;color:#6a5a3a}
    ` },
  { id:"spread", name:"Magazine Spread", structure: {layout:"spread", sidebar:null, showCrawl:false, showPoll:false, showQuiz:false, showStats:false, showSupport:true, footer:"newspaper"}, css: `
      body{background:#faf8f5;color:#1a1a1a;font-family:'Playfair Display',Georgia,serif}
      .header{text-align:center;border-bottom:2px solid #2a2216;padding:12px 20px}
      .brand{font-size:40px;font-weight:900;letter-spacing:-1px}
      .brand i{font-style:normal}
      .nav{font-family:Inter;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#999;margin-top:4px}
      .grid{display:grid;grid-template-columns:1fr 280px;gap:24px;max-width:1020px;margin:0 auto;padding:20px}
      .mast{background:#f0ece4;border-left:4px solid #c1121f;padding:20px;margin-bottom:16px}
      .mast h1{font-size:26px;font-weight:700;line-height:1.1;margin:4px 0}
      .mast p{font-family:Inter;font-size:13px;color:#555;line-height:1.5}
      .cards{display:grid;grid-template-columns:1fr 1fr;gap:16px}
      .card{border-bottom:1px solid #ddd;padding-bottom:10px}
      .card .k{font-family:Inter;font-size:9px;font-weight:700;text-transform:uppercase;color:#c1121f;margin-bottom:2px}
      .card h3{font-size:16px;font-weight:700;line-height:1.2;margin-bottom:2px}
      .card p{font-family:Inter;font-size:11px;color:#666}
      .side{border-left:1px solid #ddd;padding-left:20px}
      .panel h4{font-family:Inter;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#c1121f;border-bottom:1px solid #2a2216;padding-bottom:4px;margin-bottom:6px}
      .sitem{font-family:Inter;font-size:12px;padding:5px 0;border-bottom:1px solid #eee;color:#555}
      .panel.support{background:#f0ece4;padding:12px;text-align:center}
      .btn{width:100%;padding:8px;background:#2a2216;color:#f5f0e8;border:none;font-family:Inter;font-weight:700;font-size:12px;cursor:pointer}
      .foot{border-top:2px solid #2a2216;margin-top:20px;padding:10px 20px;display:flex;justify-content:space-between;font-family:Inter;font-size:10px;color:#999}
    ` },
  { id:"ticker", name:"News Ticker + Thumbnails", structure: {layout:"grid", showCrawl:true, crawlThumbs:true, sidebar:null, showPoll:false, showQuiz:false, showStats:false, showSupport:true, footer:"minimal"}, css: `
      body{background:#0a0e17;color:#e8edf5;font-family:Inter,sans-serif}
      .crawl{background:linear-gradient(90deg,#1a1a3e,#16213e);padding:8px 0;overflow:hidden;white-space:nowrap;border-bottom:2px solid #0af}
      .crawl-item{display:inline-flex;align-items:center;gap:8px;margin-right:44px;font-size:13px;font-weight:500;animation:marq 40s linear infinite}
      .crawl-item .th{width:26px;height:26px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff}
      @keyframes marq{0%{transform:translateX(0)}100%{transform:translateX(-100%)}}
      .header{display:flex;justify-content:space-between;align-items:center;padding:12px 20px}
      .brand{font-size:22px;font-weight:700}
      .brand i{color:#0af;font-style:normal}
      .nav{display:flex;gap:12px;font-size:12px;color:#5a6a8a}
      .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;max-width:1100px;margin:0 auto;padding:16px}
      .card{background:#111927;border:1px solid #1e2a3e;border-radius:6px;padding:12px}
      .card.wide{grid-column:span 2}
      .card .k{font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
      .card h3{font-size:13px;font-weight:600;margin-bottom:2px}
      .card p{font-size:11px;color:#5a6a8a}
      .foot-row{max-width:1100px;margin:12px auto;display:flex;gap:10px;padding:0 16px}
      .panel{flex:1;background:#111927;border:1px solid #1e2a3e;border-radius:6px;padding:12px;text-align:center}
      .btn{padding:8px 20px;background:#0af;color:#0a0e17;border:none;border-radius:4px;font-size:12px;font-weight:700;cursor:pointer}
      .foot{border-top:1px solid #1e2a3e;margin-top:12px;padding:8px 20px;display:flex;justify-content:space-between;font-size:10px;color:#3a4a6a}
    ` },
  { id:"split", name:"Split Inbox", structure: {layout:"split", sidebar:null, showCrawl:false, showPoll:false, showQuiz:false, showStats:false, footer:"minimal"}, css: `
      body{background:#f5f5f5;color:#1a1a1a;font-family:Inter,sans-serif;height:100vh;display:flex;flex-direction:column}
      .header{display:flex;align-items:center;gap:12px;padding:8px 16px;background:#fff;border-bottom:1px solid #e0e0e0}
      .brand{font-size:16px;font-weight:700}
      .brand i{color:#0072f5;font-style:normal}
      .search{flex:1;padding:5px 12px;background:#f0f0f0;border-radius:6px;font-size:12px;color:#999}
      .split{display:flex;flex:1;overflow:hidden}
      .list{width:360px;flex-shrink:0;border-right:1px solid #e0e0e0;overflow-y:auto;background:#fff}
      .card{padding:10px 12px;border-bottom:1px solid #e8e8e8}
      .card.on{background:#fff8e8;border-bottom:2px solid var(--accent,#fbbf24)}
      .card .k{font-size:10px;font-weight:700;text-transform:uppercase;color:var(--accent,#fbbf24)}
      .card h3{font-size:14px;font-weight:600;margin:2px 0}
      .card p{font-size:12px;color:#666}
      .card .t{font-size:11px;color:#999;margin-top:3px}
      .content{flex:1;padding:20px 24px;overflow-y:auto;background:#fafafa}
      .content h1{font-size:24px;font-weight:700;margin:4px 0 6px}
      .byline{font-size:12px;color:#999;margin-bottom:12px}
      .body{background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:16px;font-size:14px;line-height:1.6;color:#333}
      .discuss{background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:12px;margin-top:12px;font-size:12px}
      .foot{border-top:1px solid #e0e0e0;padding:6px 16px;font-size:10px;color:#999;display:flex;justify-content:space-between}
    ` },
  { id:"glass", name:"Glassmorphism", structure: {layout:"center", sidebar:null, showCrawl:false, showPoll:true, showQuiz:false, showStats:false, showSupport:true, footer:"minimal"}, css: `
      body{background:linear-gradient(135deg,#0f0c29,#302b63,#24243e);color:#fff;font-family:Inter,sans-serif}
      .header{background:rgba(255,255,255,0.05);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;max-width:950px;margin:16px auto}
      .brand{font-size:18px;font-weight:700;background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
      .nav{display:flex;gap:16px;font-size:12px;color:rgba(255,255,255,0.5)}
      .grid{max-width:950px;margin:0 auto;padding:0 16px}
      .mast{background:rgba(255,255,255,0.05);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:28px;margin-bottom:16px}
      .mast h1{font-size:30px;font-weight:700;line-height:1.05;margin:6px 0}
      .mast p{font-size:13px;color:rgba(255,255,255,0.5);line-height:1.5}
      .cards{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
      .card{background:rgba(255,255,255,0.05);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:18px}
      .card .k{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:rgba(167,139,250,0.8);margin-bottom:4px}
      .card h3{font-size:14px;font-weight:600;margin-bottom:2px}
      .card p{font-size:11px;color:rgba(255,255,255,0.4)}
      .panels{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px}
      .panel{background:rgba(255,255,255,0.05);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:14px;text-align:center}
      .panel h4{font-size:12px;font-weight:600;margin-top:4px}
      .btn{margin-top:6px;padding:6px 14px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer}
      .foot{background:rgba(255,255,255,0.05);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:10px 20px;display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,0.3)}
    ` },
  { id:"board", name:"Bulletin Board", structure: {layout:"masonry", sidebar:null, showCrawl:false, showPoll:true, showQuiz:false, showStats:false, showSupport:true, footer:"minimal"}, css: `
      body{background:#2c1810;color:#d4a574;font-family:'DM Serif Display',Georgia,serif;position:relative}
      body::before{content:"";position:absolute;inset:0;background-image:radial-gradient(circle at 20px 20px,rgba(180,140,100,0.05) 1px,transparent 1px);background-size:40px 40px;pointer-events:none}
      .header{text-align:center;border-bottom:2px dashed #8b7355;padding-bottom:10px;margin:16px auto 20px;max-width:900px}
      .brand{font-size:26px;font-weight:700;letter-spacing:2px;color:#c9a84c}
      .brand i{font-style:normal}
      .nav{font-family:Inter;font-size:9px;color:#8b7355;text-transform:uppercase;letter-spacing:3px;margin-top:4px}
      .grid{column-count:3;column-gap:14px;max-width:900px;margin:0 auto;padding:0 16px}
      .card,.mast,.panel{break-inside:avoid;margin-bottom:14px;display:inline-block;width:100%;position:relative;padding:16px;border-radius:2px;box-shadow:2px 3px 6px rgba(0,0,0,0.2)}
      .pin{position:absolute;top:-6px;left:50%;margin-left:-6px;width:12px;height:12px;background:#c1121f;border-radius:50%}
      .card .k{font-family:Inter;font-size:9px;font-weight:700;text-transform:uppercase;color:#c1121f;margin-bottom:3px}
      .card h3{font-size:15px;font-weight:700;margin-bottom:2px;color:#2c1810}
      .card p{font-family:Inter;font-size:11px;color:#5a4a30}
      .mast{background:#f5e6c8;color:#2c1810;transform:rotate(-1deg)}
      .panel h4{font-family:Inter;font-size:9px;font-weight:700;text-transform:uppercase;color:#c1121f;margin-bottom:6px}
      .btn{width:100%;padding:8px;background:#2c1810;color:#f5e6c8;border:none;font-family:Inter;font-weight:700;font-size:11px;cursor:pointer}
      .foot{margin-top:16px;border-top:2px dashed #8b7355;padding:10px 16px;display:flex;justify-content:space-between;font-family:Inter;font-size:9px;color:#8b7355}
    ` },
  { id:"audio", name:"Audio / Podcast", structure: {layout:"list", sidebar:null, showCrawl:false, showPoll:false, showQuiz:false, showStats:false, showSupport:true, footer:"minimal"}, css: `
      body{background:#0d1117;color:#c9d1d9;font-family:Inter,sans-serif}
      .header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;max-width:760px;margin:0 auto}
      .brand{font-size:18px;font-weight:700}
      .brand i{color:#58a6ff;font-style:normal}
      .nav{display:flex;gap:12px;font-size:11px;color:#5a6a8a}
      .grid{max-width:760px;margin:0 auto;padding:0 16px}
      .hero{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:16px;display:flex;align-items:center;gap:14px;margin-bottom:16px}
      .hero .art{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#58a6ff,#6e40c9);display:flex;align-items:center;justify-content:center;font-size:22px}
      .hero h3{font-size:14px;font-weight:600}
      .hero .sub{font-size:11px;color:#5a6a8a}
      .wave{width:60px;height:4px;background:#30363d;border-radius:2px}
      .wave i{display:block;height:100%;width:35%;background:#58a6ff;border-radius:2px}
      .card{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:12px;display:flex;align-items:center;gap:12px;margin-bottom:6px}
      .card .art{width:36px;height:36px;border-radius:8px;background:#30363d;display:flex;align-items:center;justify-content:center;font-size:16px}
      .card .k{font-size:10px;color:#5a6a8a}
      .card h3{font-size:13px;font-weight:600}
      .play{margin-left:auto;font-size:14px;color:#58a6ff;width:32px;height:32px;border-radius:50%;background:#21262d;display:flex;align-items:center;justify-content:center}
      .panel{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:12px;text-align:center;margin-bottom:6px}
      .btn{padding:8px 20px;background:#58a6ff;color:#0d1117;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer}
      .foot{border-top:1px solid #30363d;margin-top:12px;padding:8px 16px;display:flex;justify-content:space-between;font-size:10px;color:#5a6a8a}
    ` },
  { id:"social", name:"Social Feed", structure: {layout:"feed", sidebar:null, showCrawl:false, showPoll:false, showQuiz:false, showStats:false, footer:"minimal"}, css: `
      body{background:#000;color:#e7e9ea;font-family:Inter,sans-serif;font-size:15px}
      .header{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:1px solid #2f3336;max-width:600px;margin:0 auto}
      .brand{font-size:18px;font-weight:700}
      .brand i{color:#1d9bf0;font-style:normal}
      .nav{display:flex;gap:14px;font-size:13px;color:#71767b}
      .grid{max-width:600px;margin:0 auto}
      .card{display:flex;gap:10px;padding:10px 12px;border-bottom:1px solid #2f3336}
      .card .av{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
      .card .who{display:flex;gap:4px;font-size:14px;color:#71767b}
      .card .who b{color:#e7e9ea}
      .card h3{font-size:15px;font-weight:700;margin:2px 0}
      .card p{font-size:14px;margin:2px 0}
      .meta{display:flex;gap:40px;margin-top:6px;font-size:13px;color:#71767b}
      .foot{border-top:1px solid #2f3336;max-width:600px;margin:0 auto;padding:8px 12px;display:flex;justify-content:space-between;font-size:12px;color:#71767b}
    ` },
  { id:"map", name:"News Map", structure: {layout:"map", sidebar:null, showCrawl:false, showPoll:false, showQuiz:false, showStats:false, showSupport:true, footer:"minimal"}, css: `
      body{background:#0a0e17;color:#c8d6e5;font-family:Inter,sans-serif}
      .header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;max-width:1000px;margin:0 auto}
      .brand{font-size:18px;font-weight:700}
      .brand i{color:#0af;font-style:normal}
      .nav{display:flex;gap:10px;font-size:11px;color:#5a6a8a}
      .grid{display:grid;grid-template-columns:1fr 320px;gap:16px;max-width:1000px;margin:0 auto;padding:0 16px}
      .list{display:flex;flex-direction:column;gap:6px}
      .card{background:#111927;border:1px solid #1e2a3e;border-radius:8px;padding:10px;display:flex;gap:10px;align-items:center}
      .card .loc{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}
      .card .k{font-size:9px;text-transform:uppercase;letter-spacing:1px}
      .card h3{font-size:12px;font-weight:600;color:#fff;margin-top:2px}
      .mapbox{background:#111927;border:1px solid #1e2a3e;border-radius:12px;display:flex;align-items:center;justify-content:center}
      .foot-row{max-width:1000px;margin:12px auto;display:flex;gap:10px;padding:0 16px}
      .panel{flex:1;background:#111927;border:1px solid #1e2a3e;border-radius:8px;padding:10px;text-align:center}
      .btn{padding:6px 16px;background:#0af;color:#0a0e17;border:none;border-radius:4px;font-size:11px;font-weight:700;cursor:pointer}
      .foot{border-top:1px solid #1e2a3e;margin-top:12px;padding:8px 16px;display:flex;justify-content:space-between;font-size:10px;color:#3a4a6a}
    ` },
  { id:"crt", name:"CRT Terminal", structure: {layout:"full", sidebar:null, showCrawl:false, showPoll:false, showQuiz:false, showStats:true, footer:"terminal"}, css: `
      body{background:#000;color:#0f0;font-family:'IBM Plex Mono',monospace;position:relative}
      body::before{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,255,0,0.03) 50%,transparent 50%);background-size:100% 4px;pointer-events:none;animation:crts 2s linear infinite;z-index:1}
      @keyframes crts{0%{transform:translateY(0)}100%{transform:translateY(4px)}}
      .frame{border:2px solid #0f0;max-width:800px;margin:20px auto;padding:16px;position:relative;
      background:rgba(0,10,0,0.3);z-index:2}
      .header{text-align:center;border-bottom:1px solid #0f0;padding-bottom:6px;margin-bottom:10px}
      .brand{font-size:10px;letter-spacing:4px;text-transform:uppercase}
      .brand i{font-style:normal}
      .mast{color:#ff0;margin-bottom:6px}
      .mast h1{font-size:15px;font-weight:700;color:#0f0;margin:2px 0}
      .stats{display:flex;gap:20px;font-size:10px;color:#0a0;margin-bottom:10px}
      .sec{margin-bottom:8px;padding-left:16px;border-left:2px solid #0f0}
      .card{border-bottom:1px solid #0f0;padding:6px 0}
      .card h3{font-size:13px;font-weight:700;color:#0f0}
      .card p{font-size:11px;color:#0a0;white-space:pre;line-height:1.4}
      .foot{border-top:1px solid #0f0;padding-top:6px;display:flex;justify-content:space-between;font-size:10px;color:#060}
    ` },
  { id:"water", name:"Watercolor Art", structure: {layout:"center", sidebar:null, showCrawl:false, showPoll:false, showQuiz:false, showStats:false, showSupport:true, footer:"minimal"}, css: `
      body{background:linear-gradient(135deg,#fef9ef,#fdf2e9,#fef9ef);color:#2d2d2d;font-family:'Space Grotesk',sans-serif}
      .header{text-align:center;padding:20px 20px 6px}
      .paint{font-size:30px}
      .brand{font-size:28px;font-weight:400;letter-spacing:1px;color:#4a3a2a;margin-top:2px}
      .brand i{font-style:normal}
      .nav{display:flex;justify-content:center;gap:16px;font-size:12px;color:#8a7a6a;margin-top:6px}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:900px;margin:0 auto;padding:16px}
      .mast{background:rgba(255,255,255,0.6);border-radius:20px;padding:24px;grid-column:span 2;position:relative;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.04)}
      .mast::after{content:"";position:absolute;top:-30px;right:-30px;width:100px;height:100px;background:radial-gradient(circle,rgba(251,191,36,0.15),transparent);border-radius:50%}
      .mast h1{font-size:24px;font-weight:500;line-height:1.15;margin:4px 0;position:relative;z-index:1}
      .mast p{font-size:13px;color:#6a5a4a;line-height:1.5;position:relative;z-index:1}
      .card{background:rgba(255,255,255,0.6);border-radius:16px;padding:18px;position:relative;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.04)}
      .card::after{content:"";position:absolute;top:-20px;right:-20px;width:70px;height:70px;background:radial-gradient(circle,rgba(96,165,250,0.12),transparent);border-radius:50%}
      .card .k{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#60a5fa;margin-bottom:3px;position:relative;z-index:1}
      .card h3{font-size:16px;font-weight:500;margin-bottom:2px;position:relative;z-index:1}
      .support{background:rgba(255,255,255,0.6);border-radius:16px;padding:18px;grid-column:span 2;display:flex;align-items:center;gap:16px;box-shadow:0 4px 20px rgba(0,0,0,0.04)}
      .support h4{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#c9a84c}
      .support p{font-size:12px;color:#8a7a6a}
      .support .btn{flex-shrink:0}
      .btn{padding:8px 20px;background:#c9a84c;color:#fff;border:none;border-radius:12px;font-size:12px;font-weight:600;cursor:pointer}
      .foot{border-top:1px solid rgba(0,0,0,0.06);margin-top:16px;padding:10px 16px;display:flex;justify-content:space-between;font-size:11px;color:#9a8a7a}
    ` },
] as Theme[];

// Shared article data consumed by the template renderer
export const ARTICLES: any[] = [
  {mag:"Weekly Weird News", k:"CATBOY", color:"#fbbf24", title:"THE RETURN OF CATBOY: Grainy Photo Confirms Half-Cat Cryptid at 7-Eleven", desc:"Grainy security footage from a Tuscaloosa 7-Eleven. Dr. Meowton rates 9.5/10.", wide:true },
  {mag:"Weekly Weird News", k:"UFO SHED", color:"#fbbf24", title:"Local Man's Shed Contains UFO Since 1998", desc:"Authorities: 'Please stop calling.'" },
  {mag:"Tech Pulse", k:"OPENAI", color:"#60a5fa", title:"OpenAI Slows Astra Development Over Security Fears", desc:"Autonomous cyberattack capability detected on protected systems.", wide:true },
  {mag:"Tech Pulse", k:"NVIDIA", color:"#60a5fa", title:"Nvidia to Invest $3B in Stargate Data Center", desc:"Massive AI infrastructure bet in Texas." },
  {mag:"Poli Split", k:"BLANCHE", color:"#a78bfa", title:"Blanche Confirmed as Attorney General in 50-49 Vote", desc:"Nearly party-line vote. Partisan divide deepens." },
  {mag:"Poli Split", k:"KITESURF", color:"#a78bfa", title:"Cloudflare Launches Kitesurf Browser for AI Agents", desc:"A browser built for autonomous agents." }
];

// Single data source for the 7 magazines. Used by the primary-site showcase and
// by the per-magazine pages. Tags = which ancillary/context boxes suit each magazine.
export interface Magazine {
  id: string;
  name: string;
  short: string;
  tagline: string;
  description: string;
  color: string;
  accent: string;
  theme: string;
  tags: string[]; // e.g. "puzzle","game","anecdote","ticker","alert","crosspost"
}
export const MAGAZINES: Magazine[] = [
  { id:"weekly-weird-news", name:"Weekly Weird News", short:"Weird News", tagline:"The World's Only Reliable News™", description:"Satirical tabloid covering cryptids, UFOs, and the unexplainable.", color:"#8B4513", accent:"#FFD700", theme:"tabloid", tags:["anecdote","puzzle","crosspost","alert"] },
  { id:"weird-and-wild", name:"New Frontiers in Science", short:"New Frontiers", tagline:"Possible · But Weirdly Unlikely", description:"Antigravity, black holes, free energy, cold fusion, and the far-out science that might — just might — be real.", color:"#302b63", accent:"#667eea", theme:"glass", tags:["puzzle","game","ticker","alert"] },
  { id:"tech-pulse", name:"Tech Pulse", short:"Tech Pulse", tagline:"Technology. Analyzed.", description:"AI, dev tools, hardware, and the future of tech.", color:"#1e3a5f", accent:"#58a6ff", theme:"linear", tags:["ticker","alert","crosspost","puzzle"] },
  { id:"poli-split", name:"Poli Split", short:"Poli Split", tagline:"Both Sides, One Feed", description:"Red. Blue. Facts. Balanced political coverage.", color:"#7c3aed", accent:"#a78bfa", theme:"vercel", tags:["alert","ticker","crosspost"] },
  { id:"climate-watch", name:"Climate Watch", short:"Climate Watch", tagline:"The Planet's Pulse", description:"Climate science, energy transition, environmental policy.", color:"#059669", accent:"#34d399", theme:"dashboard", tags:["ticker","alert","game","anecdote"] },
  { id:"startup-signal", name:"Startup Signal", short:"Startup", tagline:"Deals, Pivots, Trends", description:"VC funding, pivots, and the next big thing.", color:"#d97706", accent:"#fbbf24", theme:"magazine", tags:["ticker","crosspost","puzzle","alert"] },
  { id:"oss-report", name:"Open Source Report", short:"OSS Report", tagline:"Community. Code. Drama.", description:"New releases, licensing battles, and dev community pulse.", color:"#dc2626", accent:"#f87171", theme:"terminal", tags:["alert","crosspost","game"] },
];

export const magazineTheme: Record<string, string> = {
  "weekly-weird-news": "tabloid",
  "weird-and-wild": "glass",
  "tech-pulse": "linear",
  "poli-split": "vercel",
  "climate-watch": "dashboard",
  "startup-signal": "magazine",
  "oss-report": "terminal",
  "local-lens": "blog",
};

// Plural alias matching what ThemeContext imports.
export const magazineThemes: Record<string, string> = magazineTheme;

export function getTheme(id: string): Theme {
  return themes.find((t) => t.id === id) || themes[0];
}

// Inject the active theme's stylesheet into <head> as a live <style id="nexus-theme-css">.
// A base rule keeps anchor-cards free of underlines/inherited link colors across all themes.
export function applyTheme(t: Theme): void {
  if (typeof document === "undefined") return;
  let el = document.getElementById("nexus-theme-css") as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = "nexus-theme-css";
    document.head.appendChild(el);
  }
  el.textContent =
    "a.card{text-decoration:none;color:inherit;display:block} " +
    ".themesel{display:block;width:100%;margin-top:6px;padding:5px 8px;font-size:12px;background:transparent;color:inherit;border:1px solid rgba(127,127,127,0.25);border-radius:6px;cursor:pointer} " +
    // Maintenance footer — styled, theme-native, "proper place for everything."
    ".maint{margin-top:24px;border-top:2px solid currentColor;padding-top:18px;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:22px 28px;font-size:13px} " +
    ".maint h4{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;opacity:.65;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid currentColor;display:inline-block} " +
    ".maint a{display:block;padding:3px 0;color:inherit;text-decoration:none;opacity:.8} .maint a:hover{opacity:1;text-decoration:underline} " +
    ".maint p{line-height:1.5;opacity:.7} " +
    ".maint input{width:100%;padding:8px 10px;margin-bottom:8px;background:transparent;color:inherit;border:1px solid currentColor;border-radius:6px;font-size:12px} " +
    ".maint .btn{display:block;width:100%;padding:9px;background:transparent;color:inherit;border:1px solid currentColor;border-radius:6px;font-weight:700;font-size:12px;text-align:center;text-decoration:none} .maint .btn:hover{background:currentColor;color:var(--on-accent,#000)} " +
    ".foot{margin-top:18px;padding:10px 0;display:flex;justify-content:space-between;gap:10px;font-size:11px;opacity:.6;text-transform:uppercase;letter-spacing:1px;border-top:1px solid currentColor;flex-wrap:wrap} " +
    ".foot.newspaper{font-family:Georgia,serif;text-transform:none;letter-spacing:.5px;border-top:3px double currentColor;justify-content:center;gap:22px} " +
    ".foot.terminal{font-family:monospace;text-transform:none;letter-spacing:0;border-top:1px dashed currentColor;justify-content:space-between;background:rgba(127,127,127,0.06)} " +
    ".cookie{position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:14px;padding:10px 16px;font-size:12px;background:#111;color:#eee;border-top:1px solid rgba(255,255,255,0.2);z-index:60;flex-wrap:wrap} .cookie button{padding:6px 12px;border:1px solid #eee;background:transparent;color:#eee;border-radius:6px;font-weight:600;cursor:pointer} .cookie .acc{background:#4a6cf7;border-color:#4a6cf7;color:#fff} " +
    // Shared magazine-showcase defaults (themes layer their own look on top)
    ".magshow{margin-bottom:22px} .magshow .cards{grid-template-columns:repeat(auto-fill,minmax(190px,1fr))} " +
    ".magshow .card.mag{cursor:pointer} .magshow .card.mag .k{font-size:9px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;font-weight:700} " +
    ".magshow .card.mag .k .magdot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px;vertical-align:middle} " +
    ".magshow .card.mag h3{font-size:14px;font-weight:700;margin-bottom:2px} .magshow .card.mag p{font-size:11px;line-height:1.35} " +
    ".mast-sub{margin:18px 0 12px} .mast-sub h2{font-size:12px;text-transform:uppercase;letter-spacing:1.2px;opacity:.75;margin:0} " +
    // Shared magazine-view styles (page inherits the active theme's paper/serif look)
    ".magazine-view{max-width:1000px;margin:0 auto} " +
    ".mag-mast{border-bottom:3px double currentColor;padding-bottom:16px;margin-bottom:20px} " +
    ".mag-back{font-size:13px;opacity:.7;text-decoration:none} " +
    ".mag-headline .mag-kicker{font-size:11px;text-transform:uppercase;letter-spacing:3px;font-weight:900;margin-bottom:4px} " +
    ".mag-headline h1{font-size:42px;font-weight:900;line-height:1;text-transform:uppercase} " +
    ".mag-headline .mag-tagline{font-size:16px;font-style:italic;margin-top:6px} " +
    ".mag-headline .mag-desc{font-size:13px;opacity:.75;margin-top:2px} " +
    ".mag-grid{display:grid;grid-template-columns:1fr 250px;gap:32px} " +
    ".mag-sec-title{font-size:12px;text-transform:uppercase;letter-spacing:2px;font-weight:900;border-bottom:2px solid currentColor;padding-bottom:6px;margin-bottom:14px} " +
    ".mag-stories{display:flex;flex-direction:column} " +
    ".mag-story{display:block;padding:14px 0;border-bottom:1px solid currentColor;text-decoration:none;color:inherit} " +
    ".mag-story .mag-story-kicker{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px} " +
    ".mag-story h3{font-size:20px;font-weight:900;line-height:1.08;text-transform:uppercase;margin-top:2px} " +
    ".mag-story p{font-size:12px;opacity:.7;margin-top:4px} " +
    ".mag-empty{display:flex;flex-direction:column;align-items:center;gap:4px;padding:40px;text-align:center;font-size:14px} " +
    ".mag-panel{border:1px solid currentColor;border-top-width:3px;padding:14px;margin-bottom:16px} " +
    ".mag-panel h4{font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:900;margin-bottom:8px;display:flex;align-items:center;gap:6px} " +
    ".mag-panel nav{display:flex;flex-direction:column} .mag-panel nav a{display:flex;align-items:center;gap:8px;padding:5px 0;color:inherit;text-decoration:none;font-size:13px;font-weight:700;border-bottom:1px dashed currentColor} .mag-panel nav a span{width:9px;height:9px;border-radius:50%} " +
    ".mag-panel.mag-puzzle{text-align:center} .mag-panel .mag-emoji{font-size:28px} .mag-panel.mag-puzzle p{font-size:12px;opacity:.75;margin:4px 0} .mag-panel.mag-puzzle > span{font-weight:900;text-transform:uppercase;font-size:12px} " +
    ".mag-dot{width:9px;height:9px;border-radius:50%;display:inline-block} " +
    ".mag-logo{max-width:520px;width:100%;height:auto;display:block;margin:10px auto 6px} " +
    ".mag-maint-cards{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px} " +
    ".mag-input{width:100%;padding:8px 10px;margin-bottom:8px;background:transparent;color:inherit;border:1px solid currentColor;border-radius:4px} " +
    ".mag-btn{display:block;width:100%;padding:9px;background:#c1121f;color:#fff;border:2px solid currentColor;text-align:center;text-decoration:none;font-weight:900;text-transform:uppercase;font-size:12px;border-radius:4px} " +
    ".mag-footer{margin-top:28px;border-top:3px double currentColor;padding-top:18px;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:18px} " +
    ".mag-footer-col h4{font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:900;margin-bottom:6px} " +
    ".mag-footer-col a{display:block;padding:2px 0;color:inherit;text-decoration:none;font-size:12px;opacity:.85} .mag-footer-col a:hover{opacity:1;text-decoration:underline} " +
    ".mag-footer-col p{font-size:11px;line-height:1.4;opacity:.75} " +
    ".mag-cookie{position:fixed;bottom:0;left:0;right:0;background:#c1121f;color:#fff;padding:10px 18px;font-size:12px;display:flex;justify-content:center;gap:12px;z-index:60;align-items:center} .mag-cookie a{color:#fff;font-weight:900;text-transform:uppercase;letter-spacing:1px;cursor:pointer;text-decoration:underline} " +
    t.css;
}


// ---- shared template renderer (from working demo) ----
// @ts-nocheck  (ported JS renderer; intentionally untyped)

// Route mapping for clickable cards (data-href drives client-side navigation in ThemeRenderer).
var MAGIDS = {
  "Weekly Weird News":"weekly-weird-news", "Weird & Wild":"weird-and-wild",
  "Tech Pulse":"tech-pulse", "Poli Split":"poli-split",
  "Climate Watch":"climate-watch", "Startup Signal":"startup-signal",
  "Open Source Report":"oss-report", "Local Lens":"local-lens"
};
function hrefFor(a){
  if(a.k === "CATBOY"){ return "/streams/weekly-weird-news/catboy-episode-1"; }
  return "/magazines/" + (MAGIDS[a.mag] || "weekly-weird-news");
}
function dh(a){ return ' data-href="'+hrefFor(a)+'"'; }

// Magazines as a grid of showcase cards (for main-content positions).
function renderMagShowcase(st){
  var scopeMag = st && st.magScope; // '';
  var s = '<div class="magshow"><div class="sec-t"><div class="dot"></div><h2>Magazines</h2></div><div class="cards">';
  MAGAZINES.forEach(function(m){
    if(scopeMag && m.short !== scopeMag && m.name !== scopeMag && m.id !== scopeMag) return;
    s += '<a class="card mag"'+h(m)+'><div class="k"><span class="magdot" style="background:'+m.accent+'"></span>'+m.short+'</div><h3>'+m.name+'</h3><p>'+m.tagline+'</p></a>';
  });
  s += '</div></div>';
  return s;
}
function h(m){ return ' href="/magazines/'+m.id+'" data-href="/magazines/'+m.id+'"'; }

// All 7 magazines as sidebar nav links (real routes).
function renderMagSideNav(){
  var s = "";
  MAGAZINES.forEach(function(m,i){
    s += '<a class="sitem'+(i===0?" on":"")+'"'+h(m)+'>'+m.name+'</a>';
  });
  return s;
}

function renderTemplate(st){
  var s = "";
  // Crawl bar
  if(st.showCrawl){
    s += '<div class="crawl">';
    var items = (st.crawlText||"CATBOY RETURNS").split(" - ");
    items.forEach(function(t){ s += '<span style="margin-right:44px">'+t+'</span>'; });
    s += '</div>';
  }
  // Header — the app navbar owns the top nav on the homepage, so hide this
  // internal brand/nav when hideHeader is set (set by the page renderer).
  if(!st.hideHeader){
    s += '<div class="header"><div class="brand"><i>AI</i> News Nexus</div><div class="nav"><a class="on">Weird</a><a>Tech</a><a>Politics</a><a>Wild</a></div></div>';
  }

  var layout = st.layout;

  // When scoped to a magazine, the hero/mast + full "Magazines" showcase are
  // skipped (the magazine name header lives in ThemeRenderer; only its content shows).
  var scoped = !!st.magScope;

  if(layout==="sidebar-left"){
    s += '<div class="grid"><div class="side">';
    st.sidebar.forEach(function(sb){
      if(sb==="nav"){s += renderMagSideNav();}
      if(sb==="subscribe"){s+='<div class="panel"><h4>Subscribe</h4><input placeholder="email"><a class="btn" href="/subscribe" data-href="/subscribe" style="display:block;text-align:center">Subscribe</a></div>';}
      if(sb==="support"){s+='<div class="panel"><h4>Support</h4><a class="btn" href="/support" data-href="/support" style="display:block;text-align:center">Become a Supporter</a></div>';}
    });
    s+='</div><div class="main">';
    if(!scoped){ s += '<div class="mast"><h1>Explore the magazines</h1><p>AI-powered analysis across 7 magazines.</p></div>'; }
    if(!scoped){ s += renderMagShowcase(); }
    s += '<div class="mast-sub"><h2>Top stories</h2></div>';
    if(st.showCrawl){ } // crawl already at very top
    s += renderSections(st, st.showStats);
    if(st.showPoll){ s += renderPoll(); }
    s += '</div></div>';
  }
  else if(layout==="sidebar-right"){
    s += '<div class="grid"><div class="main">';
    if(!scoped){ s += '<div class="mast"><h1>Explore the magazines</h1><p>AI-powered analysis across 7 magazines.</p></div>'; }
    if(!scoped){ s += renderMagShowcase(); }
    s += '<div class="mast-sub"><h2>Top stories</h2></div>';
    s += renderSections(st, st.showStats);
    if(st.showPoll){ s += renderPoll(); }
    s += '</div><div class="side">';
    st.sidebar.forEach(function(sb){
      if(sb==="nav"){s += renderMagSideNav();}
      if(sb==="support"){s+='<div class="panel"><h4>Support</h4><a class="btn" href="/support" data-href="/support" style="display:block;text-align:center">Become a Supporter</a></div>';}
    });
    s+='</div></div>';
  }
  else if(layout==="center"){
    s += '<div class="grid">';
    if(!scoped){ s += '<div class="mast"><h1>Explore the magazines</h1><p>AI-powered analysis across 7 magazines.</p></div>'; }
    if(!scoped){ s += renderMagShowcase(); }
    s += '<div class="mast-sub"><h2>Top stories</h2></div>';
    s += renderSections(st, st.showStats);
    if(st.showPoll){ s += renderPoll(); }
    s += '</div>';
  }
  else if(layout==="masonry"){
    s += '<div class="grid">';
    // lead block
    s += '<div class="mast"><h1>Stories that matter</h1><p>AI-powered across 7 magazines.</p></div>';
    ARTICLES.forEach(function(a){
      s += '<div class="card"'+dh(a)+'><div class="k" style="color:'+a.color+'">'+a.k+'</div><h3>'+a.title+'</h3><p>'+a.desc+'</p></div>';
    });
    if(st.showPoll){ s += renderPoll(); }
    if(st.showQuiz){ s += renderQuiz(); }
    if(st.showSupport){ s += '<div class="panel"><h4>Support</h4><a class="btn" href="/support" data-href="/support" style="display:block;text-align:center">Become a Supporter</a></div>'; }
    s += '</div>';
  }
  else if(layout==="full"){
    s += '<div class="frame">';
    s += renderSections(st, st.showStats, true);
    if(st.showPoll){ s += renderPoll(); }
    s += '</div>';
  }
  else if(layout==="grid"){
    // handled by grid-specific render path
    s += '<div class="grid">';
    // lead card wide
    s += '<div class="card wide"'+dh(ARTICLES[0])+'><div class="k" style="color:#ff4d4d">CATBOY</div><h3>'+ARTICLES[0].title+'</h3><p>'+ARTICLES[0].desc+'</p></div>';
    for(var i=1;i<ARTICLES.length;i++){
      s += '<div class="card"'+dh(ARTICLES[i])+'><div class="k" style="color:'+ARTICLES[i].color+'">'+ARTICLES[i].k+'</div><h3>'+ARTICLES[i].title+'</h3></div>';
    }
    s += '</div>';
    s += '<div class="foot-row"><div class="panel"><a class="btn" href="/support" data-href="/support" style="display:block;text-align:center">Support Us</a></div><div class="panel"><a class="btn" href="/subscribe" data-href="/subscribe" style="display:block;text-align:center">Subscribe</a></div></div>';
  }
  else if(layout==="list"){
    s += '<div class="grid">';
    s += '<div class="hero"><div class="art">&#x1F431;</div><div><div class="k">Now Playing</div><h3>'+ARTICLES[0].title+'</h3><div class="sub">Weekly Weird News · 12 min</div></div><div style="flex:1"></div><div class="wave"><i></i></div></div>';
    for(var j=1;j<ARTICLES.length;j++){
      s += '<div class="card"'+dh(ARTICLES[j])+'><div class="art" style="background:'+ARTICLES[j].color+'22">&#127922;</div><div><div class="k">'+ARTICLES[j].mag+'</div><h3>'+ARTICLES[j].title+'</h3></div><div class="play">&#9654;</div></div>';
    }
    s += '<div class="panel" style="display:flex;gap:10px"><a class="btn" href="/support" data-href="/support" style="flex:1;text-align:center">Support Us</a><a class="btn" href="/subscribe" data-href="/subscribe" style="flex:1;text-align:center">Subscribe</a></div>';
    s += '</div>';
  }
  else if(layout==="feed"){
    s += '<div class="grid">';
    ARTICLES.forEach(function(a,i){
      var grads=["linear-gradient(135deg,#fbbf24,#f59e0b)","linear-gradient(135deg,#60a5fa,#3b82f6)","linear-gradient(135deg,#a78bfa,#7c3aed)"];
      s += '<div class="card"'+dh(a)+'><div class="av" style="background:'+grads[i%3]+'">'+(i===0?"&#x1F431;":(i===1?"&#x1F916;":"&#x1F3DB;"))+'</div><div style="flex:1"><div class="who"><b>'+a.mag+'</b><span>2h</span></div><h3>'+a.title+'</h3><p>'+a.desc+'</p><div class="meta"><span>&#128172; 12</span><span>&#128260; 47</span><span>&#10084;&#65039; 89</span></div></div></div>';
    });
    s += '</div>';
  }
  else if(layout==="map"){
    s += '<div class="grid"><div class="list">';
    ARTICLES.forEach(function(a,i){
      var cols=["#fbbf24","#0af","#a78bfa","#00d4aa","#fbbf24","#0af"];
      s += '<div class="card"'+dh(a)+'><div class="loc" style="background:'+cols[i%6]+'22;color:'+cols[i%6]+'">&#x1F4CD;</div><div><div class="k" style="color:'+cols[i%6]+'">'+(i===0?"Tuscaloosa, AL":(i===1?"San Francisco, CA":(i===2?"Washington, DC":"Texas")))+'</div><h3>'+a.title+'</h3></div></div>';
    });
    s += '</div><div class="mapbox"><div style="text-align:center"><div style="font-size:40px">&#x1F5FA;&#xFE0F;</div><p style="font-size:13px;color:#5a6a8a">Interactive Map</p><p style="font-size:11px;color:#3a4a6a">'+ARTICLES.length+' pinned stories</p></div></div></div>';
    s += '<div class="foot-row"><div class="panel"><a class="btn" href="/support" data-href="/support" style="display:block;text-align:center">Support</a></div><div class="panel"><a class="btn" href="/subscribe" data-href="/subscribe" style="display:block;text-align:center">Subscribe</a></div></div>';
  }
  else if(layout==="split"){
    s += '<div class="split"><div class="list">';
    ARTICLES.forEach(function(a,i){
      s += '<div class="card'+(i===0?" on":"")+'"'+dh(a)+'><div class="k">'+a.k+'</div><h3>'+a.title+'</h3><p>'+a.desc+'</p><div class="t">'+(i===0?"12 min ago":"1h ago")+'</div></div>';
    });
    s += '</div><div class="content"><div class="k" style="color:#fbbf24;font-size:10px;text-transform:uppercase;letter-spacing:1px">CATBOY Exclusive</div><h1>'+ARTICLES[0].title+'</h1><div class="byline">By Weekly Weird News Staff</div><div class="body">A grainy security camera image from a Tuscaloosa 7-Eleven has captured what experts call "the clearest evidence yet" that CATBOY has returned. Dr. Patricia Meowton rates the sighting 9.5/10 on the Weird-o-Meter.</div><div class="discuss"><b>Join the Discussion</b><div style="color:#666;padding:4px 0">Have you seen CATBOY?</div><div style="color:#666;padding:4px 0">Cryptid or hoax?</div></div></div></div>';
  }
  else if(layout==="single"){
    s += '<div class="grid">';
    s += '<div class="mast"><h1>Good morning. Here\'s what matters today.</h1><p>No ads. No noise. Just what you need to know.</p></div>';
    ARTICLES.forEach(function(a){
      s += '<div class="card"'+dh(a)+'><div class="k" style="color:'+a.color+'">'+a.mag+'</div><h3>'+a.title+'</h3><p>'+a.desc+'</p><div class="t">12 comments · 2 hours ago</div></div>';
    });
    s += '<div class="subscribe"><div><h4>&#128236; Never miss a story</h4><p>Get the weirdest stories delivered daily.</p></div><input placeholder="your@email.com"><a class="btn" href="/subscribe" data-href="/subscribe" style="display:block;text-align:center">Subscribe</a></div>';
    s += '</div>';
  }
  else if(layout==="spread"){
    s += '<div class="grid"><div class="main">';
    s += '<div class="mast"><div class="k" style="font-family:Inter;font-size:10px;text-transform:uppercase;color:#c1121f;font-weight:700">The Lead</div><h1>THE RETURN OF CATBOY</h1><p>Grainy security footage from a Tuscaloosa 7-Eleven.</p></div>';
    s += '<div class="cards">';
    ARTICLES.slice(1).forEach(function(a){ s += '<div class="card"'+dh(a)+'><div class="k">'+a.k+'</div><h3>'+a.title+'</h3><p>'+a.desc+'</p></div>'; });
    s += '</div></div><div class="side"><div class="panel"><h4>Departments</h4><a class="sitem" href="/magazines/tech-pulse" data-href="/magazines/tech-pulse">Cryptid Watch</a><a class="sitem" href="/magazines/weird-and-wild" data-href="/magazines/weird-and-wild">Quantum Notes</a><a class="sitem" href="/magazines/poli-split" data-href="/magazines/poli-split">Capitol Briefing</a></div><div class="panel support"><a class="btn" href="/subscribe" data-href="/subscribe" style="display:block;text-align:center">Subscribe</a></div></div></div>';
  }

  // Footer (theme variation)
  s += footerHTML(st);
  return s;
}

function renderSections(st, showStats, full){
  var s = "";
  if(showStats){
    s += '<div class="stats"><div class="stat"><b>11</b><span>Articles</span></div><div class="stat"><b>187</b><span>Comments</span></div><div class="stat"><b>7</b><span>Magazines</span></div></div>';
  }
  var scopeMag = st.magScope; // plain-text magazine name to scope to ('' = show all)
  var magGroups = {};
  ARTICLES.forEach(function(a){ (magGroups[a.mag]=magGroups[a.mag]||[]).push(a); });
  Object.keys(magGroups).forEach(function(mag){
    if(scopeMag && mag !== scopeMag) return; // scoped: only this magazine's section
    s += '<div class="sec"><div class="sec-t"><div class="dot"></div><h2>'+mag+'</h2></div><div class="cards">';
    magGroups[mag].forEach(function(a){ s += '<div class="card"'+dh(a)+'><div class="k">'+a.k+'</div><h3>'+a.title+'</h3><p>'+a.desc+'</p></div>'; });
    s += '</div></div>';
  });
  return s;
}

function renderPoll(){
  return '<div class="panel" style="text-align:center;margin-bottom:12px"><h4>Poll — CATBOY real or hoax?</h4><button class="btn-line">100% real</button> <button class="btn-line">Marketing stunt</button></div>';
}
// Shared Subscribe + Support inline row (used by layouts that have no sidebar).
function renderQuiz(){
  return '<div class="panel" style="text-align:center;margin-bottom:12px"><div style="font-size:24px">&#x1F9E0;</div><h4>Weird News Quiz</h4><button class="btn">Take Quiz</button></div>';
}
function footerHTML(st){
  var f = st.footer || "minimal";
  // Structured maintenance footer, styled per theme (newspaper / terminal / minimal).
  var maint =
      '<div class="maint">'+
        '<div><h4>Subscribe</h4><input style="width:100%;padding:7px 10px;margin-bottom:6px;border:1px solid rgba(127,127,127,0.25);border-radius:6px;font-size:12px;background:transparent;color:inherit" placeholder="email"><a class="btn" href="/subscribe" data-href="/subscribe" style="display:block;text-align:center">Subscribe</a></div>'+
        '<div><h4>Support</h4><a href="/support#become-a-member" data-href="/support">Become a Member</a><a href="/support#gift-a-subscription" data-href="/support">Gift a Subscription</a><a href="/support#advertise" data-href="/support">Advertise</a></div>'+
        '<div><h4>Profile</h4><a href="/profile#signin" data-href="/profile">Sign In</a><a href="/profile#settings" data-href="/profile">Your Settings</a><a href="/profile#notifications" data-href="/profile">Notifications</a>' +
          '<select class="themesel" data-theme-select>'+themes.map(function(t){return '<option value="'+t.id+'">'+t.name.replace(/ \u2014 .*/,"")+'</option>';}).join('')+'</select></div>'+
        '<div><h4>Company</h4><a href="/about#our-mission" data-href="/about">About</a><a href="/about#contact" data-href="/about">Contact</a><a href="/about#careers" data-href="/about">Careers</a></div>'+
        '<div><h4>Legal</h4><a href="/legal#terms" data-href="/legal">Terms</a><a href="/legal#privacy" data-href="/legal">Privacy</a><a href="/legal#dmca" data-href="/legal">DMCA</a><a href="/legal#cookie-policy" data-href="/legal">Cookie Policy</a></div>'+
        '<div><h4>Transparency</h4><p style="font-size:11px;line-height:1.4">All summaries generated by AI. Sources linked. Human editors audit every story.</p></div>'+
      '</div>';

  var left="&copy; 2026 AI News Nexus", right="AI Disclosure · Privacy · Terms", mid="";
  if(f==="newspaper"){ left="The Daily Edition · Vol. I"; mid="August 8, 2026"; right="Satire protected"; }
  if(f==="terminal"){ left="nexus@home:~$"; mid="SIGNAL OK"; right="_"; }
  var cookie = '<div class="cookie" id="cookieBar"><span>We use cookies to personalize your news. See our Cookie Policy.</span><span><button class="acc" onclick="this.parentNode.parentNode.remove()">Accept</button> <button onclick="this.parentNode.parentNode.remove()">Decline</button></span></div>';
  return maint + '<div class="foot '+f+'"><span>'+left+'</span><span>'+mid+'</span><span>'+right+'</span></div>' + cookie;
}

// re-export for the component layer
export { renderTemplate, footerHTML, renderSections, renderPoll, renderQuiz };