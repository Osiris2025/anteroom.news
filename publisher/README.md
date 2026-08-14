# Nexus Social Publisher

Standalone, **deployment-agnostic** package that posts AI News Nexus articles to
social platforms with a link back to the source article. Works under **Docker**
(a Dockerfile + compose service is included) **and** bare-metal **systemd**
(a unit file is included).

> **Deployment note:** The hosting target (bare-metal vs same-host Docker, and
> which domain) was **undecided at build time** and may change. That is why this
> package is self-contained and domain-neutral: it reads `SITE_BASE_URL` from the
> environment and never hardcodes a host. Flip between Docker and systemd by
> changing the launcher, not the code.

## Quick start

```
export SITE_BASE_URL=https://nexus.osiris2025.com   # or your new domain
export SOCIAL_DISABLED=0                             # kill-switch
pip install -e .
nexus-social queue --status approved
nexus-social post --dry-run
```

## Architecture

```
publisher/
  __init__.py
  config.py        # env loading (SITE_BASE_URL, per-platform creds, kill-switch)
  render.py        # article -> per-platform post copy (char caps, magazine voice)
  db.py            # social_post table helpers (Postgres)
  publisher.py     # dispatch core: queued -> adapter -> record post_id/url
  adapters/
    __init__.py    # registry + get_adapter(platform)
    base.py        # BaseAdapter interface + dry-run support
    x.py           # X/Twitter via xurl CLI
    bluesky.py     # Bluesky via atproto (optional dependency)
    linkedin.py    # LinkedIn REST
  run.py           # CLI entrypoint (queue / post / metrics)
Dockerfile
publisher.service  # bare-metal systemd unit
```

## Platforms

| Platform | Adapter | Notes |
|---|---|---|
| X/Twitter | `x.py` (xurl CLI) | Paid: ~$0.20/linked post. Needs app + OAuth. |
| Bluesky | `bluesky.py` (atproto) | Free. Needs app password. |
| LinkedIn | `linkedin.py` (REST) | Free (own page). Needs OAuth token. |
| Facebook | *(planned)* | Free (Page), needs app review. |
| TikTok | *(skipped in v1)* | Requires video, not images. |

## Deployment-agnostic launchers

- **Docker:** `docker build -t nexus-publisher .` then run via the included compose
  snippet in `docker-compose.yml` (or your existing compose).
- **Bare metal:** install deps, then `systemctl enable --now nexus-publisher`.
  The `publisher.service` unit expects the venv at `/opt/nexus-publisher/venv`.

## Config (env)

| Var | Required | Purpose |
|---|---|---|
| `SITE_BASE_URL` | yes | Canonical article link base (no trailing slash). |
| `DATABASE_URL` | yes | Postgres DSN (same as the app's). |
| `SOCIAL_DISABLED` | no | `1` disables all posting (kill-switch). |
| `X_POST_*` | for X | via xurl `~/.xurl` (OAuth), not env. |
| `BLUESKY_HANDLE` / `BLUESKY_APP_PASSWORD` | for Bluesky | atproto creds. |
| `LINKEDIN_TOKEN` | for LinkedIn | OAuth access token. |
| `SOCIAL_MAX_PER_DAY` | no | Posting ceiling per platform (default 10). |

## Safety

- Never repeats the same `article_id + platform` (unique index).
- Backs off on 429 / rate-limit.
- Kill-switch via `SOCIAL_DISABLED=1`.
- Only posts to platforms explicitly enabled in config.
