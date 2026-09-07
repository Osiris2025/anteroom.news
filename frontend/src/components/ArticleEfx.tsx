"use client";

import { useEffect, useRef } from "react";

// Reusable cinematic overlay applied to an article hero image based on its `efx` value.
// Effects: 'vhs' (surveillance scanlines + wobble + static + timestamp), 'rain', 'lightning'.
// Rain = canvas particle system (physics-y: velocity, wind, depth layers, splashes).

function ArticleRainCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let running = true;

    type Drop = { x: number; y: number; len: number; speed: number; drift: number; alpha: number; layer: number };
    type Splash = { x: number; y: number; vx: number; vy: number; life: number };

    let drops: Drop[] = [];
    let splashes: Splash[] = [];

    function resize() {
      if (!canvas) return;
      const rect = canvas.parentElement?.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect?.width || canvas.clientWidth || 1));
      h = Math.max(1, Math.floor(rect?.height || canvas.clientHeight || 300));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Density scales with area; 3 depth layers (far = small/slow/dim, near = long/fast/bright)
      const target = Math.floor((w * h) / 9000);
      drops = [];
      for (let i = 0; i < target; i++) {
        const layer = i % 3; // 0 near, 1 mid, 2 far
        drops.push({
          x: Math.random() * (w + 80) - 40,
          y: Math.random() * h,
          len: layer === 0 ? 14 + Math.random() * 16 : layer === 1 ? 9 + Math.random() * 10 : 5 + Math.random() * 6,
          speed: layer === 0 ? 950 + Math.random() * 450 : layer === 1 ? 650 + Math.random() * 300 : 420 + Math.random() * 200, // px/s
          drift: 60 + Math.random() * 60, // wind px/s
          alpha: layer === 0 ? 0.5 + Math.random() * 0.3 : layer === 1 ? 0.3 + Math.random() * 0.2 : 0.16 + Math.random() * 0.14,
          layer,
        });
      }
    }

    let last = performance.now();
    function frame(now: number) {
      if (!running || !ctx) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, w, h);

      // Rain streaks — motion-blurred lines along velocity vector
      ctx.lineCap = "round";
      for (const d of drops) {
        const nx = d.x + d.drift * dt;
        const ny = d.y + d.speed * dt;
        // velocity direction for the streak
        const vlen = Math.hypot(d.drift, d.speed);
        const ux = d.drift / vlen, uy = d.speed / vlen;
        ctx.strokeStyle = `rgba(205,225,255,${d.alpha})`;
        ctx.lineWidth = d.layer === 0 ? 1.5 : d.layer === 1 ? 1.1 : 0.8;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - ux * d.len, d.y - uy * d.len);
        ctx.stroke();
        d.x = nx; d.y = ny;

        // Splash when a near-layer drop reaches the wet ground band
        if (d.layer === 0 && d.y > h - h * 0.12) {
          if (splashes.length < 60 && Math.random() < 0.4) {
            splashes.push({ x: d.x, y: d.y, vx: (Math.random() - 0.5) * 90, vy: -(40 + Math.random() * 80), life: 1 });
          }
          d.y = -20 - Math.random() * 60;
          d.x = Math.random() * (w + 80) - 40;
        } else if (d.y > h + 30) {
          d.y = -20 - Math.random() * 60;
          d.x = Math.random() * (w + 80) - 40;
        }
      }

      // Splashes — tiny arcs popping off the ground
      for (let i = splashes.length - 1; i >= 0; i--) {
        const sp = splashes[i];
        sp.life -= dt * 4;
        if (sp.life <= 0) { splashes.splice(i, 1); continue; }
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.vy += 300 * dt; // gravity
        ctx.fillStyle = `rgba(205,225,255,${0.5 * sp.life})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    resize();
    raf = requestAnimationFrame(frame);

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    const onVis = () => {
      running = document.visibilityState === "visible";
      if (running) { last = performance.now(); raf = requestAnimationFrame(frame); }
      else cancelAnimationFrame(raf);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2, mixBlendMode: "screen" }} />;
}

export default function ArticleEfx({ efx }: { efx: string | null }) {
  if (!efx) return null;

  return (
    <span style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2, overflow: "hidden" }}>
      {efx === "vhs" && <VhsEfx />}
      {efx === "rain" && <ArticleRainCanvas />}
      {efx === "lightning" && <LightningEfx />}
    </span>
  );
}

function VhsEfx() {
  const ff = (n: string) => `ae_${n}`;
  return (
    <>
      <span className="ae-scan" />
      <span className="ae-wob" />
      <span className="ae-static" />
      <span style={{ position: "absolute", bottom: 6, right: 8, fontFamily: "monospace", fontSize: 10, letterSpacing: 1, color: "rgba(255,255,255,0.92)", background: "rgba(0,0,0,0.72)", padding: "2px 6px", borderRadius: 3 }}>REC · 02:47</span>
      <style>{`
        .ae-scan,.ae-wob,.ae-static{position:absolute;inset:0;pointer-events:none}
        .ae-scan{mixBlendMode:overlay;background:repeating-linear-gradient(0deg,rgba(0,0,0,0) 0px,rgba(0,0,0,0) 2px,rgba(0,0,0,0.3) 3px,rgba(0,0,0,0) 4px)}
        .ae-wob{top:30%;height:12%;background:linear-gradient(180deg,transparent,rgba(255,255,255,0.16),rgba(255,255,255,0.03));filter:blur(1px);animation:${ff("wob")} 4s linear infinite}
        .ae-static{opacity:.12;background-image:repeating-conic-gradient(rgba(255,255,255,0.5) 0% 0.0001%,transparent 0.0002% 0.0004%);mix-blend-mode:screen;animation:${ff("flick")} .2s steps(2) infinite}
        @keyframes ${ff("wob")}{0%{transform:translateY(-22px)}15%{transform:translateY(2px) skewX(2deg)}35%{transform:translateY(-9px)}70%{transform:translateY(16px) skewX(-3deg)}100%{transform:translateY(-22px)}}
        @keyframes ${ff("flick")}{0%,49%{opacity:.12}50%,100%{opacity:.05}}
      `}</style>
    </>
  );
}

function LightningEfx() {
  const ff = (n: string) => `ae_${n}`;
  return (
    <>
      <span className="ae-flash" />
      <span className="ae-bolt" />
      <style>{`
        .ae-flash,.ae-bolt{position:absolute;inset:0;pointer-events:none}
        .ae-flash{background:rgba(255,255,255,0.9);opacity:0;animation:${ff("flash")} 6s steps(1) infinite}
        .ae-bolt{inset:auto;left:42%;top:-12%;width:4px;height:60%;background:linear-gradient(180deg,#fff,rgba(255,255,255,0));transform:rotate(14deg);opacity:0;animation:${ff("bolt")} 6s steps(1) infinite}
        @keyframes ${ff("flash")}{0%,86%,100%{opacity:0}87%{opacity:.85}92%{opacity:.1}93%{opacity:.7}96%{opacity:0}}
        @keyframes ${ff("bolt")}{0%,86%,100%{opacity:0}88%,90%{opacity:1}92%{opacity:0}}
      `}</style>
    </>
  );
}
