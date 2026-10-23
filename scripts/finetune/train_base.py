# Resumable full fine-tune of flan-t5-base on CPU. Usage: python train_base.py [epochs]
import json, time, random, torch, sys, os, glob
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
torch.set_num_threads(8)
MODEL = "google/flan-t5-base"; OUT = "/workspace/ft/r5"; EPOCHS = int(sys.argv[1]) if len(sys.argv) > 1 else 3
BS = 16; LR = 3e-4; SAVE_EVERY = 60
LV = {1: "mild", 2: "middle manager", 3: "full c-suite"}
items = json.load(open("/workspace/project-synergy/tests/variations/items.json"))
pairs, seen = [], set()
for it in items:
    if it["direction"] != "toCorporate": continue
    k = it["input"].strip().lower()
    if k in seen: continue
    seen.add(k)
    for l in (1, 2, 3): pairs.append((f"Rewrite as {LV[l]} corporate speak: {it['input']}", it["ideal"][l - 1]))
rng = random.Random(0); order = []
for e in range(EPOCHS):
    idx = list(range(len(pairs))); rng.shuffle(idx); order += idx
TOTAL = len(order) // BS
print(len(pairs), "pairs", TOTAL, "steps", flush=True)
tok = AutoTokenizer.from_pretrained(MODEL)
ck = sorted(glob.glob(f"{OUT}/ckpt-*"), key=lambda p: int(p.split("-")[-1]))
start = 0
if ck:
    model = AutoModelForSeq2SeqLM.from_pretrained(ck[-1]); start = int(ck[-1].split("-")[-1])
else:
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL)
opt = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=0.0)
sched = torch.optim.lr_scheduler.LambdaLR(opt, lambda s: max(0.05, 1 - s / TOTAL))
if ck and os.path.exists(f"{ck[-1]}/opt.pt"):
    st = torch.load(f"{ck[-1]}/opt.pt"); opt.load_state_dict(st["opt"]); sched.load_state_dict(st["sched"])
print("resume from", start, flush=True)
model.train(); t0 = time.time()
for step in range(start, TOTAL):
    batch = [pairs[i] for i in order[step * BS:(step + 1) * BS]]
    enc = tok([a for a, _ in batch], return_tensors="pt", padding=True, truncation=True, max_length=128)
    lab = tok([b for _, b in batch], return_tensors="pt", padding=True, truncation=True, max_length=128).input_ids
    lab[lab == tok.pad_token_id] = -100
    loss = model(**enc, labels=lab).loss
    loss.backward(); torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0); opt.step(); sched.step(); opt.zero_grad()
    if step % 10 == 0: print(step, round(loss.item(), 3), f"{time.time()-t0:.0f}s", flush=True)
    if (step + 1) % SAVE_EVERY == 0 or step + 1 == TOTAL:
        d = f"{OUT}/ckpt-{step+1}"; model.save_pretrained(d); tok.save_pretrained(d)
        torch.save({"opt": opt.state_dict(), "sched": sched.state_dict()}, f"{d}/opt.pt")
        for old in sorted(glob.glob(f"{OUT}/ckpt-*"), key=lambda p: int(p.split("-")[-1]))[:-2]:
            os.system(f"rm -rf {old}")
        print("saved", d, flush=True)
model.save_pretrained(f"{OUT}/final"); tok.save_pretrained(f"{OUT}/final"); print("DONE", flush=True)
