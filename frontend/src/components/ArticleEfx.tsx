"use client";

// Reusable cinematic CSS overlay applied to an article hero image based on its `efx` value.
// Effects: 'vhs' (surveillance scanlines + wobble + static + timestamp), 'rain', 'lightning'.
// Extensible — add a new case here + a label in the admin EFX picker.
const UID = "ae";

function ff(n: string) { return `ae_${n}`; }

// Rain tile generator: 256x256 tile with ~26 randomized short streaks.
// Seeded PRNG (mulberry32) so SSR and client produce the identical tile (no hydration flash).
function rainTile(seed: number, baseOpacity: number): string {
  let t = seed >>> 0;
  const rnd = () => { t += 0x6D2B79F5; let x = Math.imul(t ^ (t >>> 15), 1 | t); x ^= x + Math.imul(x ^ (x >>> 7), 61 | x); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const lines: string[] = [];
  const n = 26;
  for (let i = 0; i < n; i++) {
    const x = Math.round(rnd() * 256);
    const y = Math.round(rnd() * 256);
    const len = 9 + Math.round(rnd() * 16);           // 9-25px streak
    const w = (0.8 + rnd() * 1.1).toFixed(2);          // 0.8-1.9px width
    const op = (baseOpacity * (0.5 + rnd() * 0.5)).toFixed(2);
    // slanted streak: dx = len * tan(12deg) ~ len * 0.21
    const dx = (len * 0.21).toFixed(1);
    lines.push(`<line x1='${x}' y1='${y}' x2='${x + Number(dx)}' y2='${y + len}' stroke='white' stroke-width='${w}' stroke-opacity='${op}' stroke-linecap='round'/>`);
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 256 256'>${lines.join("")}</svg>`;
  return encodeURIComponent(svg).replace(/'/g, "%27").replace(/"/g, "%22");
}
const RAIN_TILE_A = rainTile(1337, 0.42);
const RAIN_TILE_B = rainTile(4242, 0.30);
const RAIN_TILE_C = rainTile(90210, 0.55);

export default function ArticleEfx({ efx }: { efx: string | null }) {
  if (!efx) return null;
  const b = `${UID}-${efx}`;

  return (
    <span className={b} data-efx={efx}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2, overflow: "hidden" }}>

      {efx === "vhs" && (
        <>
          <span className="ae-scan" />
          <span className="ae-wob" />
          <span className="ae-static" />
          <span style={{ position: "absolute", bottom: 6, right: 8, fontFamily: "monospace", fontSize: 10, letterSpacing: 1, color: "rgba(255,255,255,0.92)", background: "rgba(0,0,0,0.72)", padding: "2px 6px", borderRadius: 3 }}>REC · 02:47</span>
        </>
      )}
      {efx === "rain" && (<><span className="ae-rain ae-rain-a" /><span className="ae-rain ae-rain-b" /><span className="ae-rain ae-rain-c" /></>)}
      {efx === "lightning" && (<><span className="ae-flash" /><span className="ae-bolt" /></>)}

      <style>{`
        /* shared positioning */
        .ae-scan,.ae-wob,.ae-static,.ae-rain,.ae-flash,.ae-bolt{position:absolute;inset:0;pointer-events:none}

        /* VHS */
        .ae-scan{mixBlendMode:overlay;background:repeating-linear-gradient(0deg,rgba(0,0,0,0) 0px,rgba(0,0,0,0) 2px,rgba(0,0,0,0.3) 3px,rgba(0,0,0,0) 4px)}
        .ae-wob{top:30%;height:12%;background:linear-gradient(180deg,transparent,rgba(255,255,255,0.16),rgba(255,255,255,0.03));filter:blur(1px);animation:${ff("wob")} 4s linear infinite}
        .ae-static{opacity:.12;background-image:repeating-conic-gradient(rgba(255,255,255,0.5) 0% 0.0001%,transparent 0.0002% 0.0004%);mix-blend-mode:screen;animation:${ff("flick")} .2s steps(2) infinite}
        @keyframes ${ff("wob")}{0%{transform:translateY(-22px)}15%{transform:translateY(2px) skewX(2deg)}35%{transform:translateY(-9px)}70%{transform:translateY(16px) skewX(-3deg)}100%{transform:translateY(-22px)}}
        @keyframes ${ff("flick")}{0%,49%{opacity:.12}50%,100%{opacity:.05}}

        /* Rain v3 — randomized SVG streak tiles, 3 parallax layers.
           Streaks are short rounded lines at pseudo-random x/y/length/opacity,
           so no repeating pattern reads. Angle: ~12deg from vertical (dx=1,dy=5). */
        .ae-rain{overflow:hidden}
        .ae-rain::before{content:"";position:absolute;inset:-30% -30%;background-image:url("data:image/svg+xml,${RAIN_TILE_A}");background-size:260px 260px;animation:${ff("rainA")} .5s linear infinite}
        .ae-rain-b::before{background-image:url("data:image/svg+xml,${RAIN_TILE_B}");background-size:170px 170px;animation:${ff("rainB")} .34s linear infinite}
        .ae-rain-c::before{background-image:url("data:image/svg+xml,${RAIN_TILE_C}");background-size:420px 420px;animation:${ff("rainC")} .9s linear infinite}
        @keyframes ${ff("rainA")}{0%{transform:translate3d(-10px,-52px,0)}100%{transform:translate3d(2px,52px,0)}}
        @keyframes ${ff("rainB")}{0%{transform:translate3d(-7px,-40px,0)}100%{transform:translate3d(1.5px,40px,0)}}
        @keyframes ${ff("rainC")}{0%{transform:translate3d(-14px,-80px,0)}100%{transform:translate3d(3px,80px,0)}}

        /* Lightning */
        .ae-flash{background:rgba(255,255,255,0.9);opacity:0;animation:${ff("flash")} 6s steps(1) infinite}
        .ae-bolt{left:42%;top:-12%;width:4px;height:60%;background:linear-gradient(180deg,#fff,rgba(255,255,255,0));transform:rotate(14deg);opacity:0;animation:${ff("bolt")} 6s steps(1) infinite}
        @keyframes ${ff("flash")}{0%,86%,100%{opacity:0}87%{opacity:.85}92%{opacity:0}95%{opacity:.4}97%{opacity:0}}
        @keyframes ${ff("bolt")}{0%,86%,94%,100%{opacity:0}87%{opacity:1}89%{opacity:0}91%{opacity:.7}93%{opacity:0}95%{opacity:.5}}
      `}</style>
    </span>
  );
}