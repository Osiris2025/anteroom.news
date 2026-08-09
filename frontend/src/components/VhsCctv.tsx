"use client";
import { useRef, useState, useEffect, useCallback } from "react";

/**
 * Interactive VHS viewer for the CATBOY surveillance still.
 * - Shows the VHS image with a live animated scanline + static-noise overlay.
 * - A "signal" control lets you crank the static (interactive) and re-sync.
 * - Includes a 02:47 timestamp and REC flash for the security-cam vibe.
 */
export default function VhsCctv({ src, alt }: { src: string; alt: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [staticLevel, setStaticLevel] = useState(0.35); // 0..1 noise opacity
  const [recording, setRecording] = useState(true);

  // Animate the noise on a transparent canvas over the image.
  const tick = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const w = c.width, h = c.height;
    const img = ctx.createImageData(w, h);
    const d = img.data;
    const level = staticLevel;
    for (let i = 0; i < d.length; i += 4) {
      const v = 255 * Math.random();
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = Math.random() < level ? 32 + Math.random() * 70 : 0;
    }
    ctx.putImageData(img, 0, 0);
  }, [staticLevel]);

  useEffect(() => {
    const id = setInterval(tick, 66); // ~15fps static
    return () => clearInterval(id);
  }, [tick]);

  return (
    <div className="relative rounded-lg overflow-hidden mb-2 border-2 border-amber-800"
      style={{ aspectRatio: "16/9", background: "#000" }}>
      <img src={src} alt={alt} className="w-full h-full object-cover" style={{ filter: "contrast(1.15) saturate(0.7)" }} />

      {/* static noise canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen" style={{ opacity: 0.4 }} />

      {/* horizontal scanlines */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,0.25) 3px, rgba(0,0,0,0) 4px)"
      }} />

      {/* v-shaped tracking wobble bar */}
      <div className="absolute left-0 right-0 h-10 pointer-events-none"
        style={{
          top: "40%",
          background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.14), rgba(255,255,255,0.03))",
          filter: "blur(1px)",
          animation: "vhsWobble 4s linear infinite",
        }} />

      <style>{`
        @keyframes vhsWobble {
          0% { transform: translateY(-30px); }
          10% { transform: translateY(-15px) skewX(3deg); }
          20% { transform: translateY(-45px); }
          50% { transform: translateY(20px) skewX(-4deg); }
          80% { transform: translateY(-5px) skewX(2deg); }
          100% { transform: translateY(-30px); }
        }
        @keyframes recBlink { 0%,49% {opacity:1} 50%,100% {opacity:0} }
      `}</style>

      {/* timestamp + REC */}
      <div className="absolute bottom-2 right-3 font-mono text-xs text-white/95 bg-black/70 px-2 py-0.5 rounded" style={{ letterSpacing: "1px" }}>
        TUSCALOOSA, AL &#8212; 02:47 &#8226; CAM 04
      </div>
      {recording && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 px-2 py-0.5 rounded font-mono text-xs"
          style={{ color: "#ff3b3b", animation: "recBlink 1.2s step-end infinite" }}>
          <span className="w-2 h-2 rounded-full" style={{ background: "#ff3b3b" }} /> REC
        </div>
      )}

      {/* interactive signal controls */}
      <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/70 px-2 py-1 rounded-lg">
        <span className="text-[10px] font-mono text-white/70 uppercase tracking-wider">Signal</span>
        <input
          type="range" min="0" max="1" step="0.05" value={staticLevel}
          onChange={(e) => setStaticLevel(parseFloat(e.target.value))}
          aria-label="Signal static"
          className="w-20 accent-amber-400"
        />
        <button
          onClick={() => setRecording(!recording)}
          className="text-[10px] font-mono uppercase tracking-wider text-white/80 hover:text-white"
          style={{ border: "1px solid rgba(255,255,255,0.4)", borderRadius: 4, padding: "1px 5px" }}
        >
          {recording ? "⏹" : "▶"}
        </button>
      </div>

      {/* corner tag */}
      <div className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-black/85 text-yellow-400"
        style={{ letterSpacing: "1px" }}>&#x1F4F8; EVIDENCE &#183; AUTHENTICATED</div>

      {/* licensing / value watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span
          className="uppercase font-black text-white/15"
          style={{ fontSize: "clamp(14px,4vw,40px)", letterSpacing: "6px", transform: "rotate(-18deg)", fontFamily: "'Arial Black',Arial,sans-serif", textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
        >Property of Weekly Weird News</span>
      </div>

      {/* reward tag */}
      <div className="absolute bottom-12 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold uppercase text-yellow-400"
        style={{ letterSpacing: "1px" }}>&#11088; UNRELEASED FOOTAGE &#183; FOR LICENSING</div>
    </div>
  );
}
