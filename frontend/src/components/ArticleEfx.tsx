"use client";

// Reusable cinematic CSS overlay applied to an article hero image based on its `efx` value.
// Effects: 'vhs' (surveillance scanlines + wobble + static + timestamp), 'rain', 'lightning'.
// Extensible — add a new case here + a label in the admin EFX picker.
const UID = "ae";

function ff(n: string) { return `ae_${n}`; }

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
      {efx === "rain" && <span className="ae-rain" />}
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

        /* Rain */
        .ae-rain{opacity:.4}
        .ae-rain::before{content:"";position:absolute;left:-20%;right:-20%;top:-20%;bottom:-20%;background:repeating-linear-gradient(115deg,transparent 0 11px,rgba(255,255,255,0.55) 11px 12px);animation:${ff("rain")} .45s linear infinite}
        @keyframes ${ff("rain")}{0%{transform:translateY(0)}100%{transform:translateY(34px)}}

        /* Lightning */
        .ae-flash{background:rgba(255,255,255,0.9);opacity:0;animation:${ff("flash")} 6s steps(1) infinite}
        .ae-bolt{left:42%;top:-12%;width:4px;height:60%;background:linear-gradient(180deg,#fff,rgba(255,255,255,0));transform:rotate(14deg);opacity:0;animation:${ff("bolt")} 6s steps(1) infinite}
        @keyframes ${ff("flash")}{0%,86%,100%{opacity:0}87%{opacity:.85}92%{opacity:0}95%{opacity:.4}97%{opacity:0}}
        @keyframes ${ff("bolt")}{0%,86%,94%,100%{opacity:0}87%{opacity:1}89%{opacity:0}91%{opacity:.7}93%{opacity:0}95%{opacity:.5}}
      `}</style>
    </span>
  );
}