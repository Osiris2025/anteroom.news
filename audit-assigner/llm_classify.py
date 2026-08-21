#!/usr/bin/env python3
"""
LLM-based subcategory classifier (PROPOSE ONLY - never writes to DB).

Reads untagged articles, uses deepseek-v4-flash-0731 (via OpenRouter) to derive
category+subcategory from title+summary, writes proposals to a TSV.
"""
import subprocess, json, sys, os, time

OPENROUTER_KEY = None
MODEL = "deepseek/deepseek-chat-v3-0324"

def load_key():
    global OPENROUTER_KEY
    for path in ["/home/todd/ai-news-nexus/.env", "/home/todd/.hermes/.env"]:
        try:
            for line in open(path):
                if line.startswith("OPENROUTER_API_KEY="):
                    OPENROUTER_KEY = line.strip().split("=",1)[1]
                    return
        except Exception:
            pass
    if OPENROUTER_KEY is None:
        # try env
        OPENROUTER_KEY = os.environ.get("OPENROUTER_API_KEY")

def psql(sql):
    """Run read-only psql via docker exec, stdin-piped, <<<-delimited. NEVER writes."""
    full = "\\pset format unaligned\n\\pset fieldsep \"<<<\"\n" + sql + "\n"
    r = subprocess.run(
        ["docker","exec","-i","nexus-db","sh","-c","psql -U nexus -d nexus -f /dev/stdin"],
        input=full, capture_output=True, text=True)
    if r.returncode != 0:
        print("psql error:", r.stderr[:200], file=sys.stderr)
    return r.stdout

def llm_classify(mag, title, summary, vocab):
    """Call deepseek via OpenRouter to derive category+subcategory."""
    if not OPENROUTER_KEY:
        return "NO_KEY", "NO_KEY"
    prompt = (
        f"Article from magazine '{mag}'. Valid subcategories: {', '.join(vocab)}.\n"
        f"Title: {title}\nSummary: {summary}\n\n"
        "Return ONLY a single valid subcategory name from the list that best fits. "
        "If none fit, return 'uncategorized'. No extra text."
    )
    payload = {
        "model": MODEL,
        "messages": [
            {"role":"system","content":"You classify news articles into subcategories. Return only the subcategory slug."},
            {"role":"user","content": prompt},
        ],
        "max_tokens": 30,
        "temperature": 0,
    }
    try:
        import urllib.request
        req = urllib.request.Request("https://openrouter.ai/api/v1/chat/completions",
            data=json.dumps(payload).encode(), method="POST",
            headers={"Content-Type":"application/json","Authorization":f"Bearer {OPENROUTER_KEY}"})
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read())
        msg = data["choices"][0]["message"]
        content = (msg.get("content") or "").strip()
        if not content and msg.get("reasoning"):
            content = msg["reasoning"].strip()
        return content or "NO_OUTPUT"
    except Exception as e:
        return "ERROR", str(e)[:50]

def main():
    load_key()
    if not OPENROUTER_KEY:
        print("FATAL: no OPENROUTER_API_KEY found")
        return
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    sql = ("SELECT a.id, m.name, a.title, coalesce(a.summary,chr(39)||chr(39)) "
           "FROM article a JOIN magazine m ON m.id=a.magazine_id "
           "WHERE a.subcategory IS NULL OR a.subcategory=chr(39)||chr(39) "
           "ORDER BY m.name, a.submitted_at DESC LIMIT " + str(limit))
    out = psql(sql)
    rows = []
    for line in out.strip().splitlines():
        if "<<<" not in line or "Field separator" in line or "Output format" in line:
            continue
        parts = line.split("<<<", 3)
        if len(parts) == 4:
            rows.append([p.replace('"','').strip() for p in parts])
    print(f"Loaded {len(rows)} untagged articles for LLM classification")
    # minimal vocab (from ground truth) - full map would go here
    VOCAB = {
      "AI Frontier": ["agents","models","cybersecurity","hardware-datacenters","open-source","business","research","releases","policy-safety"],
      "Tech Pulse": ["ai","gaming","cybersecurity","policy-safety","dev-tools","infrastructure","startups","releases"],
      "Political Picture": ["elections","policy","world","congress","executive","judiciary","state-local"],
      "Weekly Weird News": ["cryptids","ufo-aliens","ancient-wonders","conspiracy-coverup","mythology-folklore","true-crime-killers","war-military","haunted-ghosts","cults-religion"],
      "Dark Matter": ["stars","black-holes","exoplanets","cosmic-webs","dark-matter-energy","gravitational-waves","history-instruments"],
      "The Veil": ["consciousness","meditation","parapsychology","buddhism","brain-science","energy-healing","wellbeing"],
      "Startup Signal": ["deals","funding","ipo","acquisitions","venture-capital","founders","overview"],
      "Watch Tower": ["climate","energy","environment","policy","conservation","disasters"],
      "Vital Signs": ["longevity","medicine","mental-health","nutrition","fitness","public-health"],
      "Open Source Report": ["releases","community","licensing","security"],
      "Science Frontiers": ["discoveries","frontier","astronomy","physics","biology","climate","materials"],
    }
    outfile = "/home/todd/ai-news-nexus/audit-assigner/llm-proposals.tsv"
    with open(outfile,"w") as f:
        f.write("article_id\tmagazine\tproposed_subcategory\ttitle\n")
        for rid, mag, title, summ in rows:
            vocab = VOCAB.get(mag, [])
            sub = llm_classify(mag, title, summ[:500], vocab)
            f.write(f"{rid}\t{mag}\t{sub}\t{title[:80]}\n")
            print(f"  {mag[:18]:20} -> {str(sub)[:20]:20} | {title[:50]}")
            time.sleep(0.3)
    print(f"\nWrote proposals to {outfile}")

if __name__ == "__main__":
    main()