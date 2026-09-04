# AI News Nexus

Multi-stream AI-powered news aggregation platform with social syndication,
community discussion, and gamification. Built for the homelab.

**Project path:** `~/projects/anteroom/`
**Obsidian Vault:** `~/.hermes/obsidian-vault/projects/ai-news-nexus/`

## Structure

| Directory | Purpose |
|---|---|
| `engine/` | AI ingestion and agent pipeline |
| `frontend/` | Next.js web application |
| `publisher/` | Social media syndication (X, Bluesky, LinkedIn) |
| `traefik/` | Reverse proxy and routing |
| `streams/` | Per-magazine stream configurations |

## Quick Start

```bash
cd ~/projects/anteroom
docker compose up -d
```

## Documentation

Full project documentation lives in the Obsidian vault:
- **[[AI News Nexus|Project Plan]]** — Architecture, roadmap, feature registry
- **[[Kanban]]** — Current task board
- **[[Roadmap]]** — Milestones and phases
- **Reference docs:** Architecture (ADR), API specs, deployment guides, data schemas

All vault paths: `~/.hermes/obsidian-vault/projects/ai-news-nexus/`
