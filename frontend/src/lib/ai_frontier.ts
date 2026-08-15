// AI Frontier registry — tracks the fast-moving "everything-AI" landscape for the
// Neural Hardware magazine ONLY. Each tracked model/framework has keyword + source
// rules used to match articles, so we can show the freshest release per model on
// the right rail and link to a curated per-model news page.
export type FrontierModel = {
  slug: string;
  name: string;
  vendor: string;
  // Title keywords (lowercased) that tag an article to this model.
  keys: string[];
  // Source-host hints (e.g. "openai.com") — strong signal.
  hosts?: string[];
  color: string;
  desc: string;
};

export const FRONTIER_MODELS: FrontierModel[] = [
  { slug: "hermes", name: "Hermes Agent", vendor: "Nous Research", keys: ["hermes agent", "hermes 4", "hermes-4", "hermes"], hosts: ["github.com/nousresearch"], color: "#a78bfa", desc: "Open-source agent from Nous Research" },
  { slug: "gpt", name: "GPT / OpenAI", vendor: "OpenAI", keys: ["gpt", "openai", "o3", "o4", "chatgpt", "sora"], hosts: ["openai.com"], color: "#10a37f", desc: "OpenAI's frontier chat & reasoning models" },
  { slug: "claude", name: "Claude", vendor: "Anthropic", keys: ["claude", "anthropic", "opus", "sonnet"], hosts: ["anthropic.com"], color: "#d97757", desc: "Anthropic's Claude family" },
  { slug: "gemini", name: "Gemini", vendor: "Google", keys: ["gemini", "deepmind", "bard", "nano banana"], hosts: ["deepmind.google", "ai.google.dev"], color: "#4285f4", desc: "Google DeepMind's multimodal models" },
  { slug: "llama", name: "Llama", vendor: "Meta", keys: ["llama", "meta ai", "meta-llama"], hosts: ["ai.meta.com", "llama.com"], color: "#0866ff", desc: "Meta's open-weights family" },
  { slug: "deepseek", name: "DeepSeek", vendor: "DeepSeek", keys: ["deepseek", "deepeek"], hosts: ["deepseek.com"], color: "#4f5bde", desc: "Chinese frontier & reasoning open model" },
  { slug: "qwen", name: "Qwen", vendor: "Alibaba", keys: ["qwen", "alibaba", "tongyi"], hosts: ["qwenlm.github.io", "qwen.ai"], color: "#7b5cff", desc: "Alibaba's open model family" },
  { slug: "grok", name: "Grok / xAI", vendor: "xAI", keys: ["grok", "xai", "x-ai", "grok imagine", "grok bot", "elon musk"], hosts: ["x.ai"], color: "#0a0a0a", desc: "xAI's Grok models" },
  { slug: "mistral", name: "Mistral", vendor: "Mistral AI", keys: ["mistral", "mixtral", "codestral", "maestro"], hosts: ["mistral.ai"], color: "#ff6b35", desc: "French open-model lab" },
  { slug: "bytedance", name: "ByteDance / Doubao", vendor: "ByteDance", keys: ["bytedance", "doubao", "seed-o1", "seed-o3"], hosts: ["bytedance.com"], color: "#00c4cc", desc: "ByteDance's Doubao/Seed models" },
  { slug: "opal", name: "Opal / SoftBank", vendor: "SoftBank", keys: ["opal", "softbank"], hosts: [], color: "#e11d48", desc: "SoftBank Enterprise compute / advanced AI" },
  { slug: "minimax", name: "MiniMax", vendor: "MiniMax", keys: ["minimax", "hailuo"], hosts: ["minimax.io"], color: "#22d3ee", desc: "China's MiniMax / Hailuo open models" },
  { slug: "glm", name: "GLM / Zhipu", vendor: "Zhipu AI", keys: ["glm", "zhipu", "chatglm", "codegeex"], hosts: ["zhipuai.cn"], color: "#818cf8", desc: "Zhipu's GLM family" },
  { slug: "kimi", name: "Kimi / Moonshot", vendor: "Moonshot AI", keys: ["kimi", "moonshot", "kimi k2", "kimi-k3"], hosts: ["moonshot.cn", "kimi.moonshot"], color: "#fb7185", desc: "Moonshot's Kimi reasoning models" },
  { slug: "nemotron", name: "Nemotron / Nvidia", vendor: "NVIDIA", keys: ["nemotron", "nvidia nim", "nvidia ai"], hosts: ["nvidia.com", "build.nvidia.com"], color: "#76b900", desc: "NVIDIA's Nemotron open models" },
  { slug: "cohere", name: "Cohere", vendor: "Cohere", keys: ["cohere", "command r", "command-r"], hosts: ["cohere.com"], color: "#dc6ece", desc: "Cohere's Command/enterprise models" },
  { slug: "perplexity", name: "Perplexity", vendor: "Perplexity", keys: ["perplexity", "pplx", "sonar"], hosts: ["perplexity.ai"], color: "#38bdf8", desc: "Perplexity's search/agent models" },
];

// Resolve the models an article belongs to, from title/sourceUrl.
export function matchModels(article: { title?: string | null; sourceUrl?: string | null }): string[] {
  const t = (article.title || "").toLowerCase();
  const u = (article.sourceUrl || "").toLowerCase();
  const hits: string[] = [];
  for (const m of FRONTIER_MODELS) {
    if (m.hosts && m.hosts.some((h) => u.includes(h))) hits.push(m.slug);
    else if (m.keys.some((k) => t.includes(k))) hits.push(m.slug);
  }
  return hits;
}

export function slugifyName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}