import json,re
def fails(path):
    f={}
    for line in open(path):
        if line.startswith('#'): continue
        for m in re.finditer(r'(\d{3}):(\d+)',line): f[m.group(1)]=set(int(c) for c in m.group(2))
    return f
I=fails('grade-instant.txt'); M=fails('grade-model.txt')
rows=[json.loads(l) for l in open('fresh6-all.jsonl')]; n=len(rows)
res={}
for L in (1,2,3):
    ip=sum(L not in I.get(r['id'][2:],set()) for r in rows)
    mp=sum(L not in M.get(r['id'][2:],set()) for r in rows)
    hp=sum((L not in M.get(r['id'][2:],set())) if r['pick'][L-1]['engine']=='model' else (L not in I.get(r['id'][2:],set())) for r in rows)
    orc=sum((L not in M.get(r['id'][2:],set())) or (L not in I.get(r['id'][2:],set())) for r in rows)
    picked=sum(r['pick'][L-1]['engine']=='model' for r in rows)
    print(f"L{L}: instant {ip}/{n} {ip/n:.1%} | model {mp}/{n} {mp/n:.1%} | hybrid {hp}/{n} {hp/n:.1%} (model picked {picked}) | oracle {orc/n:.1%}")
