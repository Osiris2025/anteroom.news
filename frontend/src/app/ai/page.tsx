"use client";
import Link from "next/link";

// Mirror of FRONTIER_MODELS for the static index page (avoids importing client-only hooks)
const MODELS = [
  { slug: "hermes", name: "Hermes Agent", vendor: "Nous Research", color: "#a78bfa", desc: "Open-source agent from Nous Research" },
  { slug: "gpt", name: "GPT / OpenAI", vendor: "OpenAI", color: "#10a37f", desc: "OpenAI's frontier chat & reasoning models" },
  { slug: "claude", name: "Claude", vendor: "Anthropic", color: "#d97757", desc: "Anthropic's Claude family" },
  { slug: "gemini", name: "Gemini", vendor: "Google", color: "#4285f4", desc: "Google DeepMind's multimodal models" },
  { slug: "llama", name: "Llama", vendor: "Meta", color: "#0866ff", desc: "Meta's open-weights family" },
  { slug: "deepseek", name: "DeepSeek", vendor: "DeepSeek", color: "#4f5bde", desc: "Chinese frontier & reasoning open model" },
  { slug: "qwen", name: "Qwen", vendor: "Alibaba", color: "#7b5cff", desc: "Alibaba's open model family" },
  { slug: "grok", name: "Grok / xAI", vendor: "xAI", color: "#0a0a0a", desc: "xAI's Grok models" },
  { slug: "mistral", name: "Mistral", vendor: "Mistral AI", color: "#ff6b35", desc: "French open-model lab" },
  { slug: "bytedance", name: "ByteDance / Doubao", vendor: "ByteDance", color: "#00c4cc", desc: "ByteDance's Doubao/Seed models" },
  { slug: "opal", name: "Opal / SoftBank", vendor: "SoftBank", color: "#e11d48", desc: "SoftBank Enterprise compute / advanced AI" },
  { slug: "minimax", name: "MiniMax", vendor: "MiniMax", color: "#22d3ee", desc: "China's MiniMax / Hailuo open models" },
  { slug: "glm", name: "GLM / Zhipu", vendor: "Zhipu AI", color: "#818cf8", desc: "Zhipu's GLM family" },
  { slug: "kimi", name: "Kimi / Moonshot", vendor: "Moonshot AI", color: "#fb7185", desc: "Moonshot's Kimi reasoning models" },
  { slug: "nemotron", name: "Nemotron / Nvidia", vendor: "NVIDIA", color: "#76b900", desc: "NVIDIA's Nemotron open models" },
  { slug: "cohere", name: "Cohere", vendor: "Cohere", color: "#dc6ece", desc: "Cohere's Command/enterprise models" },
  { slug: "perplexity", name: "Perplexity", vendor: "Perplexity", color: "#38bdf8", desc: "Perplexity's search/agent models" },
];

export default function AIIndexPage() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 80px" }}>
      <Link href="/" style={{ fontSize: 12, opacity: 0.6, textDecoration: "none", color: "inherit" }}>
        ← Home
      </Link>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: "16px 0 6px" }}>AI Frontier</h1>
      <p style={{ opacity: 0.55, fontSize: 14, margin: "0 0 28px" }}>
        Track the freshest releases per tracked AI model or framework — curated stories from Neural Hardware.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {MODELS.map((m) => (
          <Link
            key={m.slug}
            href={`/ai/${m.slug}`}
            style={{
              display: "flex", flexDirection: "column", gap: 8,
              padding: 18, borderRadius: 12,
              border: "1px solid var(--border, rgba(150,150,150,.16))",
              textDecoration: "none", color: "inherit",
              transition: "border-color .12s, box-shadow .12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = m.color;
              e.currentTarget.style.boxShadow = `0 0 0 1px ${m.color}22`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border, rgba(150,150,150,.16))";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: m.color, flex: "none" }} />
              <span style={{ fontWeight: 700, fontSize: 15 }}>{m.name}</span>
            </div>
            <span style={{ fontSize: 11, opacity: 0.5 }}>{m.vendor}</span>
            <span style={{ fontSize: 12, opacity: 0.6, lineHeight: 1.4 }}>{m.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}