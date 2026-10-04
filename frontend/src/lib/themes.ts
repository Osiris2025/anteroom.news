// @ts-nocheck  -- ported from nexus_template.html working theme generator.
// AUTO-GENERATED from nexus_template.html (working theme generator).
// Each theme carries a structural spec + its own full CSS stylesheet.
// The shared renderTemplate consumes the structure; theme CSS feeds into
// the rendered HTML. CSS is never inline in the markup.

export interface Theme {
  id: string; name: string; structure: any; css: string;
}

export const themes: Theme[] = [
  { id:"linear", name:"Linear \u2014 Dark Precision", structure: {layout:"sidebar-left", sidebar:["nav"], showPoll:false, showQuiz:false, showCrawl:false, showStats:false, footer:"minimal"}, css: `
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
  { id:"vercel", name:"Vercel \u2014 White Minimal", structure: {layout:"sidebar-left", sidebar:["nav"], showPoll:false, showQuiz:false, showCrawl:false, showStats:false, footer:"minimal"}, css: `
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
  { id:"crawler", name:"News Crawler \u2014 TV", structure: {layout:"grid", showCrawl:false, sidebar:null, showPoll:false, showQuiz:false, showStats:false, showSupport:true, footer:"minimal"}, css: `
      :root{--accent:#e11d2e}
      body{background:#0a0a0c;color:#f4f4f5;font-family:'Barlow','Inter',Arial,sans-serif}
      h1,h2,h3,.mz-ed-title,.mz-ed-h2{font-family:'Oswald','Arial Narrow',Impact,sans-serif !important}
      h1,h2,.mz-ed-h2{text-transform:uppercase;letter-spacing:.03em}
      .mz-ed-title{text-transform:uppercase;font-weight:600 !important;letter-spacing:.01em;line-height:1.1 !important}
      .mz-ed-kicker{letter-spacing:.12em !important}
      main [class*="mz-ed-"],main [class*="mag-"],main .card,main .panel,main .btn{border-radius:2px !important}
      main [style*="border-radius"]{border-radius:2px !important}
      main [style*="border-radius: 50%"],main [style*="border-radius:50%"],main img[class*="avatar"]{border-radius:50% !important}
      .mz-ed-cell{background:#131316 !important;border-left:4px solid #e11d2e !important;border-color:#2a2a2e #2a2a2e #2a2a2e #e11d2e !important}
      .mz-ed-cell:hover{background:#1b1b1f !important}
      main [style*="linear-gradient(120deg"]{background:linear-gradient(110deg,#7d0d17,#16161a 72%) !important;border-color:#2a2a2e !important}
      .crawl{display:none}
      .grid{max-width:1100px;margin:0 auto;padding:16px}
      .panel{background:#131316;border-top:3px solid #e11d2e;padding:12px;text-align:center}
      .panel h4{font-family:'Oswald',Arial,sans-serif;text-transform:uppercase;letter-spacing:.08em;font-size:13px}
      .btn{padding:10px 22px;background:#e11d2e;color:#fff;border:none;font-family:'Oswald',Arial,sans-serif;text-transform:uppercase;letter-spacing:.08em;font-size:13px;font-weight:700;cursor:pointer}
      .foot-row{max-width:1100px;margin:12px auto;display:flex;gap:10px;padding:0 16px}
      .foot{border-top:3px solid #e11d2e;margin-top:12px;padding:8px 20px;display:flex;justify-content:space-between;font-size:10px;color:#777;text-transform:uppercase;letter-spacing:.08em}
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
      :root{--accent:#d9b25f;--card-bg:rgba(217,178,95,.04);--border:#d9b25f}
      body{background:radial-gradient(ellipse at top,#2a2150 0%,#15112b 60%);background-attachment:fixed;color:#efe2c4;font-family:'Josefin Sans','Century Gothic',sans-serif}
      h1,h2,h3,.mz-ed-title,.mz-ed-h2{font-family:'Poiret One','Josefin Sans',sans-serif !important;font-weight:700 !important}
      h1,h2,.mz-ed-h2{text-transform:uppercase;letter-spacing:.22em !important;color:#d9b25f}
      main [style*="border-radius"],main [class*="mz-ed-"],main .card,main .panel,main .btn{border-radius:0 !important}
      .mz-ed-cell{background:rgba(217,178,95,.05) !important;border:1px solid #d9b25f !important;box-shadow:inset 0 0 0 5px #15112b,inset 0 0 0 6px rgba(217,178,95,.65) !important;padding:24px 26px !important}
      .mz-ed-cell:hover{transform:none !important;background:rgba(217,178,95,.1) !important}
      .mz-ed-thumb{margin:-24px -26px 14px !important;border-bottom:1px solid #d9b25f}
      .mz-ed-title{text-transform:uppercase;letter-spacing:.06em !important;font-size:19px !important;line-height:1.25 !important;text-align:center}
      .mz-ed-cell-wide .mz-ed-title{font-size:26px !important}
      .mz-ed-kicker{justify-content:center;letter-spacing:.3em !important;color:#d9b25f !important}
      .mz-ed-summary{text-align:center;opacity:.78 !important}
      .mz-ed-moreblock,.mz-ed-moreblock-card{background:transparent !important;border-color:#d9b25f !important}
      main [style*="linear-gradient(120deg"]{background:linear-gradient(180deg,#241c4a,#15112b) !important;border:1px solid #d9b25f !important;box-shadow:inset 0 0 0 5px #15112b,inset 0 0 0 6px rgba(217,178,95,.65) !important}
      .panel{border:1px solid #d9b25f;padding:14px;text-align:center}
      .panel h4{font-family:'Poiret One',sans-serif;letter-spacing:.25em;text-transform:uppercase;color:#d9b25f}
      .btn{padding:11px 24px;background:transparent;color:#d9b25f;border:1px solid #d9b25f;font-family:'Josefin Sans',sans-serif;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.3em;cursor:pointer}
      .btn:hover{background:#d9b25f;color:#15112b}
      .foot{border-top:1px solid #d9b25f;margin-top:20px;padding:12px 20px;display:flex;justify-content:space-between;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#a08a55}
    ` },
  { id:"spread", name:"Magazine Spread", structure: {layout:"spread", sidebar:null, showCrawl:false, showPoll:false, showQuiz:false, showStats:false, showSupport:true, footer:"newspaper"}, css: `
      :root{--accent:#8a1d24;--card-bg:transparent;--border:#1b1b1b}
      body{background:#f4eee2;color:#1b1b1b;font-family:'Lora',Georgia,serif}
      h1,h2,h3,.mz-ed-title,.mz-ed-h2{font-family:'Playfair Display',Georgia,serif !important}
      h1{font-weight:900;letter-spacing:-.02em}
      h2,.mz-ed-h2{font-style:italic;font-weight:700;text-transform:none !important;letter-spacing:0 !important;font-size:20px !important;border-bottom:2px solid #1b1b1b;padding-bottom:6px}
      main [style*="border-radius"],main [class*="mz-ed-"],main .card,main .panel,main .btn{border-radius:0 !important}
      .mz-ed-cell{background:transparent !important;border:0 !important;border-top:3px solid #1b1b1b !important;padding:14px 0 0 !important;box-shadow:none !important}
      .mz-ed-cell:hover{transform:none !important;border-top-color:#8a1d24 !important}
      .mz-ed-thumb{margin:0 0 12px !important;border-radius:0 !important}
      .mz-ed-kicker{font-family:'Lora',serif;font-style:italic;text-transform:none !important;letter-spacing:.02em !important;font-size:12px !important;font-weight:600 !important;color:#8a1d24 !important}
      .mz-ed-title{font-weight:900 !important;font-size:23px !important;line-height:1.08 !important;letter-spacing:-.01em !important}
      .mz-ed-cell-wide .mz-ed-title{font-size:34px !important}
      .mz-ed-summary{font-family:'Lora',serif;opacity:.8 !important}
      .mz-ed-moreblock,.mz-ed-moreblock-card{background:transparent !important;border-color:#1b1b1b !important}
      main [style*="linear-gradient(120deg"]{background:#ede4d2 !important;border:0 !important;border-top:6px double #1b1b1b !important;border-bottom:2px solid #1b1b1b !important}
      .panel{border-top:3px solid #1b1b1b;padding:12px;text-align:center}
      .panel h4{font-family:'Playfair Display',serif;font-style:italic;font-size:15px}
      .btn{padding:10px 22px;background:#8a1d24;color:#fff;border:none;font-family:'Playfair Display',serif;font-style:italic;font-size:14px;cursor:pointer}
      .foot{border-top:3px double #1b1b1b;margin-top:14px;padding:10px 20px;display:flex;justify-content:space-between;font-family:'Lora',serif;font-style:italic;font-size:12px;color:#555}
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
      :root{--accent:#ffb199;--card-bg:rgba(0,0,0,.25);--border:rgba(0,0,0,.15)}
      body{background-color:#5a3d28;background-image:radial-gradient(rgba(0,0,0,.22) 1px,transparent 1.6px),radial-gradient(rgba(255,220,170,.10) 1px,transparent 1.8px);background-size:8px 8px,13px 13px;background-attachment:fixed;color:#f6e7cc;font-family:'Patrick Hand','Comic Sans MS',cursive}
      h1,h2,.mz-ed-h2{font-family:'Caveat','Patrick Hand',cursive !important;font-weight:700 !important;font-size:34px !important;text-transform:none !important;letter-spacing:0 !important;color:#fff3d6}
      main [class*="mz-ed-"],main .card,main .panel,main .btn{border-radius:3px !important}
      .mz-ed-grid{padding-top:10px}
      .mz-ed-cell{position:relative;background:#fff7b0 !important;color:#2c1a0c !important;border:0 !important;padding:26px 20px 18px !important;box-shadow:2px 6px 12px rgba(0,0,0,.45) !important;transform:rotate(-1.4deg);transition:transform .15s ease}
      .mz-ed-cell:nth-child(4n+2){background:#ffd3de !important;transform:rotate(1.2deg)}
      .mz-ed-cell:nth-child(4n+3){background:#c9ecff !important;transform:rotate(-.6deg)}
      .mz-ed-cell:nth-child(4n+4){background:#d4f5bd !important;transform:rotate(1.6deg)}
      .mz-ed-cell:hover{transform:rotate(0) scale(1.025) !important;z-index:3}
      .mz-ed-cell::before{content:"";position:absolute;top:7px;left:50%;margin-left:-8px;width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ff8a80,#b3261e 60%,#6b0f0a);box-shadow:1px 3px 3px rgba(0,0,0,.45);z-index:2}
      .mz-ed-thumb{margin:0 0 10px !important;border:4px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)}
      .mz-ed-title{font-family:'Patrick Hand',cursive !important;font-weight:400 !important;font-size:21px !important;line-height:1.15 !important;letter-spacing:0 !important;color:#2c1a0c}
      .mz-ed-cell-wide .mz-ed-title{font-size:27px !important}
      .mz-ed-kicker{color:#b3261e !important;font-family:'Caveat',cursive;font-size:17px !important;text-transform:none !important;letter-spacing:0 !important}
      .mz-ed-summary{opacity:.85 !important;color:#3b2a18}
      .mz-ed-moreblock,.mz-ed-moreblock-card{background:rgba(255,247,176,.92) !important;color:#2c1a0c !important;border-color:rgba(0,0,0,.15) !important}
      main [style*="linear-gradient(120deg"]{background:#f6e7cc !important;color:#2c1a0c !important;border:0 !important;box-shadow:2px 6px 12px rgba(0,0,0,.45);transform:rotate(-.6deg)}
      .panel{background:#f6e7cc;color:#2c1a0c;padding:16px;text-align:center;box-shadow:2px 5px 10px rgba(0,0,0,.4);transform:rotate(.8deg)}
      .panel h4{font-family:'Caveat',cursive;font-size:22px;color:#b3261e}
      .btn{padding:9px 20px;background:#b3261e;color:#fff;border:none;font-family:'Patrick Hand',cursive;font-size:16px;cursor:pointer}
      .foot{margin-top:16px;border-top:2px dashed #c9a47a;padding:10px 16px;display:flex;justify-content:space-between;font-size:13px;color:#d9bf99}
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
      :root{--accent:#6b8fd6;--card-bg:rgba(255,255,255,.62);--border:rgba(120,140,190,.25)}
      body{background-color:#fbf7ef;background-image:radial-gradient(circle at 12% 8%,rgba(147,197,253,.42),transparent 38%),radial-gradient(circle at 88% 14%,rgba(251,207,232,.5),transparent 36%),radial-gradient(circle at 70% 85%,rgba(187,247,208,.45),transparent 40%),radial-gradient(circle at 8% 78%,rgba(253,230,138,.38),transparent 34%);background-attachment:fixed;color:#3a3550;font-family:'Nunito','Avenir',sans-serif}
      h1,h2,h3,.mz-ed-title,.mz-ed-h2{font-family:'Cormorant Garamond',Georgia,serif !important}
      h1{font-style:italic;font-weight:600}
      h2,.mz-ed-h2{font-style:italic;text-transform:none !important;letter-spacing:0 !important;font-size:24px !important;font-weight:600 !important}
      main [style*="border-radius"]{border-radius:22px 28px 20px 26px !important}
      .mz-ed-cell{background:rgba(255,255,255,.66) !important;border:0 !important;border-radius:24px 30px 22px 28px !important;box-shadow:0 10px 30px rgba(120,140,200,.18),0 2px 6px rgba(240,170,200,.18) !important}
      .mz-ed-cell:nth-child(3n+2){border-radius:30px 22px 28px 24px !important}
      .mz-ed-cell:nth-child(3n+3){border-radius:22px 28px 30px 20px !important}
      .mz-ed-cell:hover{transform:translateY(-3px) !important;box-shadow:0 14px 34px rgba(120,140,200,.28) !important}
      .mz-ed-thumb{border-radius:24px 30px 0 0 !important;opacity:.95}
      .mz-ed-title{font-weight:600 !important;font-size:22px !important;line-height:1.15 !important;letter-spacing:0 !important;color:#2f2a48}
      .mz-ed-cell-wide .mz-ed-title{font-size:30px !important}
      .mz-ed-kicker{font-family:'Nunito',sans-serif;color:#6b8fd6 !important;letter-spacing:.14em !important}
      .mz-ed-summary{opacity:.8 !important}
      .mz-ed-moreblock,.mz-ed-moreblock-card{background:rgba(255,255,255,.55) !important;border-color:rgba(120,140,190,.2) !important;border-radius:26px 22px 28px 24px !important}
      main [style*="linear-gradient(120deg"]{background:linear-gradient(120deg,rgba(147,197,253,.5),rgba(251,207,232,.55) 55%,rgba(187,247,208,.5)) !important;border:0 !important;color:#2f2a48 !important}
      .panel{background:rgba(255,255,255,.6);border-radius:24px 28px 22px 26px;padding:16px;text-align:center;box-shadow:0 8px 24px rgba(120,140,200,.15)}
      .panel h4{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:20px;color:#6b8fd6}
      .btn{padding:10px 24px;background:linear-gradient(120deg,#8fb3ee,#f2a7c7);color:#fff;border:none;border-radius:999px;font-family:'Nunito',sans-serif;font-weight:700;font-size:13px;cursor:pointer}
      .foot{border-top:1px solid rgba(120,140,190,.25);margin-top:16px;padding:10px 16px;display:flex;justify-content:space-between;font-size:12px;color:#8a85a5}
    ` },
] as Theme[];

// Shared article data consumed by the template renderer
export const ARTICLES: any[] = [
  {mag:"Weekly Weird News", k:"CATBOY", color:"#fbbf24", title:"THE RETURN OF CATBOY: Grainy Photo Confirms Half-Cat Cryptid at 7-Eleven", desc:"Grainy security footage from a Tuscaloosa 7-Eleven. Dr. Meowton rates 9.5/10.", wide:true },
  {mag:"Weekly Weird News", k:"UFO SHED", color:"#fbbf24", title:"Local Man's Shed Contains UFO Since 1998", desc:"Authorities: 'Please stop calling.'" },
  {mag:"Tech Pulse", k:"OPENAI", color:"#60a5fa", title:"OpenAI Slows Astra Development Over Security Fears", desc:"Autonomous cyberattack capability detected on protected systems.", wide:true },
  {mag:"Tech Pulse", k:"NVIDIA", color:"#60a5fa", title:"Nvidia to Invest $3B in Stargate Data Center", desc:"Massive AI infrastructure bet in Texas." },
  { mag:"Political Picture", k:"BLANCHE", color:"#a78bfa", title:"Blanche Confirmed as Attorney General in 50-49 Vote", desc:"Nearly party-line vote. Partisan divide deepens." },
  { mag:"Political Picture", k:"KITESURF", color:"#a78bfa", title:"Cloudflare Launches Kitesurf Browser for AI Agents", desc:"A browser built for autonomous agents." }
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
  realm: string; // "Tech" | "Science" | "Health" | "SFF" | "Pulse" | "Mysteries" | "Pop"
  tags: string[]; // e.g. "puzzle","game","anecdote","ticker","alert","crosspost"
}
export const MAGAZINES: Magazine[] = [
  // TECH
  { id:"neural-hardware", name:"AI Frontier", short:"AI Frontier", tagline:"AI. Cyber. Compute.", description:"Artificial intelligence, frontier models, cybersecurity, and the hardware powering tomorrow's datacenters.", color:"#00cc88", accent:"#00fa9a", theme:"linear", realm:"Tech", tags:["ticker","alert","crosspost","puzzle"] },
  { id:"tech-pulse", name:"Tech Pulse", short:"Tech Pulse", tagline:"Technology. Analyzed.", description:"AI, dev tools, hardware, and the future of tech.", color:"#1e3a5f", accent:"#58a6ff", theme:"linear", realm:"Tech", tags:["ticker","alert","crosspost","puzzle"] },
  { id:"startup-signal", name:"Startup Signal", short:"Startup", tagline:"Deals, Pivots, Trends", description:"VC funding, pivots, and the next big thing.", color:"#d97706", accent:"#fbbf24", theme:"magazine", realm:"Tech", tags:["ticker","crosspost","puzzle","alert"] },
  { id:"oss-report", name:"Open Source Report", short:"OSS Report", tagline:"Community. Code. Drama.", description:"New releases, licensing battles, and dev community pulse.", color:"#dc2626", accent:"#f87171", theme:"terminal", realm:"Tech", tags:["alert","crosspost","game"] },
  // SCIENCE — Science Fact vs Science Maybe
  { id:"weird-and-wild", name:"Science Frontiers", short:"Science Frontiers", tagline:"What we know, tested.", description:"Research, breakthroughs, and verified science at the advancing edge.", color:"#302b63", accent:"#667eea", theme:"glass", realm:"Science", tags:["puzzle","game","ticker","alert"] },
  { id:"dark-matter", name:"Dark Matter", short:"Dark Matter", tagline:"The universe's deepest mysteries.", description:"The speculative deep-end — black-hole universes, FTL, living-in-the-Matrix.", color:"#6b21a8", accent:"#a855f7", theme:"glass", realm:"Science", tags:["ticker","puzzle","alert","anecdote"] },
  // HEALTH
  { id:"vital-sign", name:"Vital Signs", short:"Vital Signs", tagline:"The inner cosmos, decoded.", description:"Supplements, peptides, longevity, and discoveries that may change outcomes.", color:"#0b5563", accent:"#2dd4bf", theme:"dashboard", realm:"Health", tags:["ticker","alert","puzzle","anecdote"] },
  // SFF
  { id:"starfall-weekly", name:"The Chart Room", short:"Chart Room", tagline:"Backstage of other worlds.", description:"Science fiction & fantasy — books, movies, gaming. (Starfall = the release column.)", color:"#0f380f", accent:"#00ff40", theme:"crt", realm:"SFF", tags:["ticker","alert","crosspost","puzzle"] },
  // PULSE
  { id:"poli-split", name:"Political Picture", short:"Political", tagline:"Both Sides, One Feed", description:"Red. Blue. Facts. Balanced political coverage.", color:"#7c3aed", accent:"#a78bfa", theme:"vercel", realm:"Pulse", tags:["alert","ticker","crosspost"] },
  { id:"climate-watch", name:"Watch Tower", short:"Watch Tower", tagline:"The planet's sentinel.", description:"Climate science, energy transition, environmental policy.", color:"#059669", accent:"#34d399", theme:"dashboard", realm:"Pulse", tags:["ticker","alert","game","anecdote"] },
  { id:"just-the-news-thats-fit-to-print", name:"Just the News", short:"Just the News", tagline:"Just the news that fit to print.", description:"Straight reporting, the full spectrum of current events.", color:"#475569", accent:"#94a3b8", theme:"vercel", realm:"Pulse", tags:["alert","ticker"] },
  // MYSTERIES
  { id:"weekly-weird-news", name:"Weekly Weird News", short:"Weird News", tagline:"The Weirdest Reliable News™", description:"Cryptids, UFOs, and strange cases — the creepy door.", color:"#8B4513", accent:"#FFD700", theme:"tabloid", realm:"Mysteries", tags:["anecdote","puzzle","crosspost","alert"] },
  { id:"the-veil", name:"The Veil", short:"The Veil", tagline:"Backstage of the unseen.", description:"Chakras, crystals, auras, energy healing, consciousness — the seeker door.", color:"#4c1d95", accent:"#c084fc", theme:"glass", realm:"Mysteries", tags:["anecdote","puzzle","alert"] },
  // POP
  { id:"the-green-room", name:"The Green Room", short:"Green Room", tagline:"Backstage of fame.", description:"Celebrity, culture, music — who's about to step into the spotlight.", color:"#065f46", accent:"#34d399", theme:"magazine", realm:"Pop", tags:["crosspost","anecdote","alert"] },
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
  "starfall-weekly": "crt",
  "vital-sign": "dashboard",
  "neural-hardware": "linear",
  "dark-matter": "glass",
  "just-the-news-thats-fit-to-print": "vercel",
  "the-veil": "glass",
  "the-green-room": "magazine",
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
  // Theme-specific web fonts (loaded only for the active theme).
  const FONTS: Record<string, string> = {
    crawler: "family=Oswald:wght@500;600;700&family=Barlow:wght@400;500;600",
    spread: "family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Lora:ital,wght@0,400;0,600;1,400;1,600",
    deco: "family=Poiret+One&family=Josefin+Sans:wght@400;600;700",
    board: "family=Caveat:wght@700&family=Patrick+Hand",
    water: "family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Nunito:wght@400;600;700",
  };
  let fl = document.getElementById("nexus-theme-font") as HTMLLinkElement | null;
  const fq = FONTS[t.id];
  if (fq) {
    if (!fl) { fl = document.createElement("link"); fl.id = "nexus-theme-font"; fl.rel = "stylesheet"; document.head.appendChild(fl); }
    const href = "https://fonts.googleapis.com/css2?" + fq + "&display=swap";
    if (fl.href !== href) fl.href = href;
  } else if (fl) { fl.remove(); }
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
    // Sidebar-left layouts: when the left column has no real content, drop it and
    // center the main column between the page margins (no empty open column on home).
    ".grid.grid-full{grid-template-columns:1fr !important;max-width:1160px;margin:0 auto;padding:24px 20px} " +
    ".grid.grid-full .main{max-width:880px;margin:0 auto;width:100%} " +
    ".grid.grid-side{grid-template-columns:230px 1fr !important} " +
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
  "Tech Pulse":"tech-pulse", "Poli Split":"poli-split", "Political Picture":"poli-split",
  "Climate Watch":"climate-watch", "Startup Signal":"startup-signal",
  "Open Source Report":"oss-report", "Local Lens":"local-lens", "Vital Signs":"vital-sign"
};
function hrefFor(a){
  if(a.k === "CATBOY"){ return "/streams/weekly-weird-news/catboy-episode-1"; }
  return "/magazines/" + (MAGIDS[a.mag] || "weekly-weird-news");
}
function dh(a){ return ' data-href="'+hrefFor(a)+'"'; }

// Magazines as a grid of showcase cards (for main-content positions).
function renderMagShowcase(st){
  var scopeMag = st && st.magScope; // '';
  var tags = (st && st.taglines) || {};   // id -> DB tagline (source of truth)
  var names = (st && st.names) || {};     // id -> DB name
  var descs = (st && st.descs) || {};     // id -> DB description
  var s = '<div class="magshow"><div class="sec-t"><div class="dot"></div><h2>Rooms</h2></div>';
  // Group magazines under their Realm headings (Anteroom = a house of rooms).
  var order = ["Tech","Science","Health","SFF","Pulse","Mysteries","Pop"];
  order.forEach(function(realm){
    var inRealm = MAGAZINES.filter(function(m){ return (m.realm||"")===realm; });
    if(!inRealm.length) return;
    s += '<div class="realm" style="margin-bottom:18px"><div class="realm-h" style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;opacity:.85;margin:4px 0 10px;border-bottom:1px solid rgba(150,150,150,.2);padding-bottom:6px"><span class="realm-dot" style="width:8px;height:8px;border-radius:50%;display:inline-block"></span>'+realm+'</div><div class="cards">';
    inRealm.forEach(function(m){
      if(scopeMag && m.short !== scopeMag && m.name !== scopeMag && m.id !== scopeMag) return;
      var name = names[m.id] || m.name;
      var tagline = tags[m.id] || m.tagline;
      var desc = descs[m.id] || m.description || '';
      s += '<a class="card mag"' + h(m) + '><div class="k"><span class="magdot" style="background:'+m.accent+'"></span>'+(m.short)+'</div><h3>'+name+'</h3>'
         + '<p class="magtag">'+tagline+'</p>'
         + '<p class="magdesc">'+desc+'</p></a>';
    });
    s += '</div></div>';
  });
  s += '</div>';
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
    s += '<div class="header"><div class="brand"><i>Anter</i>oom</div><div class="nav"><a class="on">Weird</a><a>Tech</a><a>Politics</a><a>Wild</a></div></div>';
  }

  var layout = st.layout;

  // When scoped to a magazine, the hero/mast + full "Magazines" showcase are
  // skipped (the magazine name header lives in ThemeRenderer; only its content shows).
  var scoped = !!st.magScope;

  if(layout==="sidebar-left"){
    // Build the sidebar content first. Only render a left column if it has real
    // content (nav/subscribe are now owned by the global hamburger + footer, so on
    // the homepage this is usually empty -> drop the column and center the main).
    var sideHTML = "";
    st.sidebar.forEach(function(sb){
      if(sb==="subscribe"){sideHTML+='<div class="panel"><h4>Subscribe</h4><input placeholder="email"><a class="btn" href="/subscribe" data-href="/subscribe" style="display:block;text-align:center">Subscribe</a></div>';}
      if(sb==="support"){sideHTML+='<div class="panel"><h4>Support</h4><a class="btn" href="/support" data-href="/support" style="display:block;text-align:center">Become a Supporter</a></div>';}
    });
    if(sideHTML){
      s += '<div class="grid grid-side"><div class="side">' + sideHTML + '</div><div class="main">';
    } else {
      s += '<div class="grid grid-full"><div class="main">';
    }
    if(!scoped){ s += '<div class="mast"><h1>Explore the magazines</h1><p>' + MAGAZINES.length + ' magazines; AI-analyzed daily.</p></div>'; }
    if(!scoped){ s += renderMagShowcase(st); }
    // Scoped pages: the real "Top Stories" grid (from published articles) renders above in
    // MagazineTopStories, so the template's static placeholder heading is removed entirely.
    if(!scoped){ s += '<div class="mast-sub"><h2>Top stories</h2></div>'; }
    if(st.showCrawl){ } // crawl already at very top
    s += renderSections(st, st.showStats);
    if(st.showPoll){ s += renderPoll(); }
    s += '</div></div>';
  }
  else if(layout==="sidebar-right"){
    s += '<div class="grid"><div class="main">';
    if(!scoped){ s += '<div class="mast"><h1>Explore the magazines</h1><p>AI-powered analysis across ' + MAGAZINES.length + ' magazines.</p></div>'; }
    if(!scoped){ s += renderMagShowcase(st); }
    if(!scoped){ s += '<div class="mast-sub"><h2>Top stories</h2></div>'; }
    s += renderSections(st, st.showStats);
    if(st.showPoll){ s += renderPoll(); }
    s += '</div><div class="side">';
    st.sidebar.forEach(function(sb){
      if(sb==="nav"){ /* magazine nav suppressed — global MagazineSwitcher (☰) owns it */ }
      if(sb==="support"){s+='<div class="panel"><h4>Support</h4><a class="btn" href="/support" data-href="/support" style="display:block;text-align:center">Become a Supporter</a></div>';}
    });
    s+='</div></div>';
  }
  else if(layout==="center"){
    s += '<div class="grid">';
    if(!scoped){ s += '<div class="mast"><h1>Explore the magazines</h1><p>AI-powered analysis across ' + MAGAZINES.length + ' magazines.</p></div>'; }
    if(!scoped){ s += renderMagShowcase(st); }
    if(!scoped){ s += '<div class="mast-sub"><h2>Top stories</h2></div>'; }
    s += renderSections(st, st.showStats);
    if(st.showPoll){ s += renderPoll(); }
    s += '</div>';
  }
  else if(layout==="masonry"){
    s += '<div class="grid">';
    // lead block
    s += '<div class="mast"><h1>Stories that matter</h1><p>AI-powered across ' + MAGAZINES.length + ' magazines.</p></div>';
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
    var mapStories = (st && st.mapStories && st.mapStories.length) ? st.mapStories : ARTICLES;
    s += '<div class="grid"><div class="list">';
    mapStories.forEach(function(a,i){
      var cols=["#fbbf24","#0af","#a78bfa","#00d4aa","#fbbf24","#0af"];
      var loc=(a&&a.subcategory)||(a&&a.mag)||"Pinned";
      s += '<div class="card"'+(a.href? ' data-href="'+a.href+'"':'')+'><div class="loc" style="background:'+cols[i%6]+'22;color:'+cols[i%6]+'">&#x1F4CD;</div><div><div class="k" style="color:'+cols[i%6]+'">'+loc+'</div><h3>'+(a.title||"")+'</h3></div></div>';
    });
    s += '</div><div class="mapbox"><div style="text-align:center"><div style="font-size:40px">&#x1F5FA;&#xFE0F;</div><p style="font-size:13px;color:#5a6a8a">Interactive Map</p><p style="font-size:11px;color:#3a4a6a">'+mapStories.length+' pinned stories</p></div></div></div>';
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
  var scoped = !!st.magScope;
  if(scoped){
    // Scoped magazine pages: the real "Top Stories" grid (from published articles)
    // renders above in MagazineTopStories. Skip static template filler/placeholders
    // so there's no duplicate section.
    return s;
  }
  var magGroups = {};
  ARTICLES.forEach(function(a){ (magGroups[a.mag]=magGroups[a.mag]||[]).push(a); });
  Object.keys(magGroups).forEach(function(mag){
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

  var left="&copy; 2026 Anteroom", right="AI Disclosure · Privacy · Terms", mid="";
  if(f==="newspaper"){ left="The Daily Edition · Vol. I"; mid="August 8, 2026"; right="Satire protected"; }
  if(f==="terminal"){ left="nexus@home:~$"; mid="SIGNAL OK"; right="_"; }
  // Cookie-consent bar — persist the choice in localStorage so it does NOT
  // reappear on every navigation (previously the buttons just removed the DOM
  // node, so the banner came back each page load). Accepted/declined = remember.
  var cookie = "";
  try {
    if (typeof window !== "undefined" && !window.localStorage.getItem("nexus-cookie")) {
      cookie = '<div class="cookie" id="cookieBar"><span>We use cookies to personalize your news. See our Cookie Policy.</span><span><button class="acc" onclick="window.localStorage.setItem(\'nexus-cookie\',\'1\');this.parentNode.parentNode.style.display=\'none\'">Accept</button> <button onclick="window.localStorage.setItem(\'nexus-cookie\',\'0\');this.parentNode.parentNode.style.display=\'none\'">Decline</button></span></div>';
    }
  } catch (e) { cookie = ""; }
  return maint + '<div class="foot '+f+'"><span>'+left+'</span><span>'+mid+'</span><span>'+right+'</span></div>' + cookie;
}

// re-export for the component layer
export { renderTemplate, footerHTML, renderSections, renderPoll, renderQuiz };
