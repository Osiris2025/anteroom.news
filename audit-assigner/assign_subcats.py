#!/usr/bin/env python3
"""
Subcategory auto-assigner (PROPOSE ONLY — never writes to the DB).

Reads untagged articles from nexus-db, classifies subcategory from title+summary
against a per-magazine taxonomy, and writes proposed tags to a TSV.
"""
import subprocess
import sys
import json

# Per-magazine valid subcategories (corrected taxonomy, from drift audit)
TAXONOMY = {
  "AI Frontier": ["agents","models","cybersecurity","hardware-datacenters","open-source","business","research","releases","policy-safety"],
  "Tech Pulse": ["overview","gaming","cybersecurity","policy-safety","ai","dev-tools","infrastructure","startups"],
  "Political Picture": ["elections","policy","world","congress","executive","judiciary","state-local"],
  "Startup Signal": ["overview","deals","funding","ipo","acquisitions","venture-capital","founders"],
  "Weekly Weird News": ["cryptids","ufo-aliens","ancient-wonders","conspiracy-coverup","mythology-folklore","true-crime-killers","war-military","nazi-occult-secrets","cults-religion","medical-weird","haunted-ghosts","lost-cities-places"],
  "Dark Matter": ["stars","black-holes","exoplanets","cosmic-webs","dark-matter-energy","gravitational-waves","history-instruments"],
  "The Veil": ["consciousness","meditation","parapsychology","buddhism","brain-science","energy-healing","wellbeing"],
  "Watch Tower": ["climate","energy","environment","policy","conservation","disasters"],
  "Vital Signs": ["longevity","medicine","mental-health","nutrition","fitness","public-health","neuroscience"],
  "Science Frontiers": ["discoveries","frontier","astronomy","physics","biology","climate","materials"],
  "Open Source Report": ["releases","community","licensing","security"],
  "Just the News": ["breaking","national","world","business","technology","science","culture"],
  "The Chart Room": ["landfall","starfall","the-rift","the-waystation","tradewinds","navigator"],
  "The Green Room": ["afters","blind-item","culture"],
}

HINTS = {
  "agents": ["agent","autonomous","tool-use","agentic","multi-agent","llm agent"],
  "models": ["model","foundation model","weights","llama","gpt","claude","fine-tun","benchmark"],
  "cybersecurity": ["cyber","hack","breach","ransomware","vulnerab","malware","phishing","zero-day","exploit","netsec","johnson"],
  "hardware-datacenters": ["chip","gpu","tpu","datacenter","semiconductor","hardware","nvidia","cpu","server","cluster"],
  "open-source": ["open source","open-source","github","oss","license","repository","fork"],
  "business": ["revenue","company","funding","startup","commercial","enterprise","market","sale","business"],
  "research": ["research","paper","arxiv","study","scientist","lab","academic"],
  "releases": ["release","announce","launch","new version","unveil","now available","introduc"],
  "policy-safety": ["safety","alignment","regulation","policy","governance","risk","compliance","ai act"],
  "elections": ["election","vote","poll","candidate","midterm","ballot","primary"],
  "policy": ["policy","regulation","law","legislat","govern","spending","bill","act"],
  "world": ["global","international","foreign","geopolit","treaty","war","diplomat","nato"],
  "congress": ["congress","senate","house","lawmaker","representative"],
  "executive": ["president","white house","executive order","administration","cabinet"],
  "judiciary": ["supreme court","court","judge","ruling","appeal"],
  "state-local": ["governor","state ","municipal","county","mayor","local"],
  "deals": ["deal","acquire","merger","acquisition","m&a","takeover"],
  "funding": ["funding","raise","series","seed","venture","capital","invest"],
  "ipo": ["ipo","public offering","publicly traded","stock market"],
  "founders": ["founder","ceo","entrepreneur"],
  "cryptids": ["cryptid","mothman","bigfoot","chupacabra","loch ness","yeti","skinwalker"],
  "ufo-aliens": ["ufo","uap","alien","extraterrestrial","saucer","unidentified flying"],
  "ancient-wonders": ["ancient","pyramid","megalith","artifac","archaeolog","egypt","stonehenge"],
  "conspiracy-coverup": ["conspira","coverup","classified","hidden","suppress","government secret"],
  "mythology-folklore": ["myth","folklore","legend","deity","goddess","tolkien","norse","celtic"],
  "true-crime-killers": ["murder","serial killer","true crime","kill","crime scene","victim"],
  "war-military": ["war","military","army","combat","soldier","battle","wwii","ww2"],
  "nazi-occult-secrets": ["nazi","occult","nazi occult","reich","hitler","himmler","ancestral"],
  "cults-religion": ["cult","religion","sect","church","prophet","doomsday","faith"],
  "medical-weird": ["medical","disease","medical anomaly","diagnosis","symptom","brain disorder"],
  "haunted-ghosts": ["haunt","ghost","spirit","paranormal activity","apparition"],
  "stars": ["star","stellar","supernova","pulsar","galaxy"],
  "black-holes": ["black hole","event horizon","singularity","accretion"],
  "exoplanets": ["exoplanet","extrasolar","planet","habitable"],
  "cosmic-webs": ["cosmic web","large-scale","filament","cosmolog","structure"],
  "dark-matter-energy": ["dark matter","dark energy","wimp","axion","cosmic inflation"],
  "gravitational-waves": ["gravitational wave","ligo","gravitational-wave","wave detector"],
  "history-instruments": ["telescope","observatory","instrument","hubble","jwst","spacecraft"],
  "consciousness": ["consciousness","awareness","mind","experience"],
  "meditation": ["meditat","mindful","zen","breathing"],
  "parapsychology": ["parapsych","psi","telepathy","precognitive","extra-sensory","psychic"],
  "buddhism": ["buddh","dharma","sangha","zen","tibetan"],
  "brain-science": ["brain","neurosci","cognition","neural","neurons","memory"],
  "energy-healing": ["energy heal","reiki","chakra","healing"],
  "wellbeing": ["wellbeing","wellness","holistic","flourish"],
  "climate": ["climate","warming","carbon","emission","co2","greenhouse","weather","temperature"],
  "energy": ["energy","oil","gas","solar","wind","nuclear","power","grid","battery"],
  "environment": ["environment","pollution","ecosystem","wildlife","nature","species"],
  "disasters": ["disaster","storm","hurricane","flood","wildfire","earthquake","fire","drought"],
  "longevity": ["longevity","aging","lifespan","anti-aging"],
  "medicine": ["medicine","drug","treatment","disease","clinic","therapy","cancer","neurolog"],
  "mental-health": ["mental","depression","anxiety","therapy","psycholog","trauma"],
  "nutrition": ["nutrition","diet","food","vitamin","protein"],
  "fitness": ["fitness","exercise","workout","training","strength"],
  "public-health": ["public health","outbreak","vaccine","pandemic","epidemic"],
  "discoveries": ["discover","finding","breakthrough","announce"],
  "astronomy": ["astronom","space","galaxy","telescope","cosmos"],
  "physics": ["physics","quantum","particle","relativity","theory"],
  "biology": ["biology","dna","gene","cell","species","organism"],
  "materials": ["material","battery","alloy","graphene","polymer","new material"],
  "gaming": ["gaming","game","console","playstation","xbox","esports"],
  "ai": ["ai","artificial intelligence","machine learning","llm","neural net","gpt"],
  "dev-tools": ["dev tool","developer","ide","compiler","framework","sdk"],
  "startups": ["startup","founder","product launch","venture-back"],
  "breaking": ["breaking","alert","just in","urgent","live"],
  "technology": ["technology","tech","software","app","device"],
  "science": ["science","research","study","data"],
  "culture": ["culture","music","film","art","entertainment","review"],
  "landfall": ["landfall","market open","opening bell"],
  "starfall": ["starfall","stock","markets","trading"],
  "the-rift": ["rift","friction","tension"],
  "the-waystation": ["waystation","dispatch","briefing"],
  "tradewinds": ["trade","tradewinds","commerce"],
  "navigator": ["navigator","guide","map"],
  "afters": ["after","post-show","roundup"],
  "blind-item": ["blind item","rumor","anonymous tip"],
}

def psql(sql):
    """Run read-only psql via docker exec, stdin-piped, <<<-delimited. NEVER writes."""
    import subprocess, sys
    full = "\\pset format unaligned\n\\pset fieldsep \"<<<\"\n" + sql + "\n"
    r = subprocess.run(
        ["docker","exec","-i","nexus-db","sh","-c","psql -U nexus -d nexus -f /dev/stdin"],
        input=full, capture_output=True, text=True)
    if r.returncode != 0:
        print("psql error:", r.stderr[:200], file=sys.stderr)
    return r.stdout

def classify(mag, text):
    """Return best-guess subcategory for a magazine from article text."""
    tl = (text or "").lower()
    cats = TAXONOMY.get(mag, [])
    if not cats:
        return None
    best_cat, best_hits = None, 0
    for cat in cats:
        hits = 0
        for kw in HINTS.get(cat, []) or []:
            if kw and kw in tl:
                hits += 1
        if hits > best_hits:
            best_hits, best_cat = hits, cat
    if best_hits == 0:
        return None  # unknown
    return best_cat

def main():
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    # untagged article sample per magazine
    sql = ("SELECT a.id, m.name, a.title, coalesce(a.summary,chr(39)||chr(39)) "
           "FROM article a JOIN magazine m ON m.id=a.magazine_id "
           "WHERE a.subcategory IS NULL OR a.subcategory=chr(39)||chr(39) "
           "ORDER BY m.name, a.submitted_at DESC LIMIT " + str(limit))
    out = psql(sql)
    rows = []
    for line in out.strip().splitlines():
        if not line.strip():
            continue
        parts = line.split("<<<", 3)
        if len(parts) == 4:
            rows.append([p.strip() for p in parts])
    print(f"Loaded {len(rows)} untagged articles")
    proposals = []
    for rid, mag, title, summ in rows:
        text = title + " " + summ
        prop = classify(mag, text)
        proposals.append((rid, mag, prop, title))
    # write proposal file
    with open("/home/todd/ai-news-nexus/audit-assigner/proposed-tags.tsv", "w") as f:
        f.write("article_id\tmagazine\tproposed_subcategory\ttitle\n")
        for rid, mag, prop, title in proposals:
            f.write(f"{rid}\t{mag}\t{prop or '(uncertain)'}\t{title[:80]}\n")
    print(f"Wrote proposals to audit-assigner/proposed-tags.tsv ({len(proposals)} rows)")
    print("\n--- PROPOSALS ---")
    for rid, mag, prop, title in proposals:
        print(f"  {(mag or '')[:20]:22} -> {str(prop or '(uncertain)'):18} | {title[:60]}")
if __name__ == "__main__":
    main()
