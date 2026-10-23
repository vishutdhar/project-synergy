# ONNX (from optimum export dir) -> dynamic int8 -> split external data into <=24 MiB chunks for Cloudflare Pages.
# Usage: exp-venv/bin/python export.py ONNX_DIR OUT_DIR
import sys, os, json, shutil, onnx
from onnxruntime.quantization import quantize_dynamic, QuantType
from onnx.external_data_helper import set_external_data
src, out = sys.argv[1], sys.argv[2]
os.makedirs(f"{out}/onnx", exist_ok=True)
CHUNK = 24 * 1024 * 1024
chunks = {}
for name in ["encoder_model", "decoder_model_merged"]:
    q = f"/tmp/{name}_quantized.onnx"
    quantize_dynamic(f"{src}/{name}.onnx", q, weight_type=QuantType.QUInt8, per_channel=False, reduce_range=False, extra_options={"EnableSubgraph": True})
    m = onnx.load(q, load_external_data=True)
    base = f"{name}_quantized.onnx"
    tensors = []
    def walk(g):
        for t in g.initializer: tensors.append(t)
        for n in g.node:
            for a in n.attribute:
                if a.type == onnx.AttributeProto.GRAPH: walk(a.g)
                for sg in a.graphs: walk(sg)
    walk(m.graph)
    files, cur, idx, off = [], bytearray(), 0, 0
    def flush():
        global cur, idx
        fn = f"{base}_data" + ("" if idx == 0 else f"_{idx}")
        open(f"{out}/onnx/{fn}", "wb").write(cur); files.append((fn, len(cur))); cur = bytearray(); idx += 1
    for t in tensors:
        if not t.HasField("raw_data") or len(t.raw_data) < 1024: continue
        data = t.raw_data
        assert len(data) <= CHUNK, (t.name, len(data))
        if len(cur) + len(data) > CHUNK: flush()
        fn = f"{base}_data" + ("" if idx == 0 else f"_{idx}")
        o = len(cur); cur += data
        set_external_data(t, location=fn, offset=o, length=len(data)); t.ClearField("raw_data"); t.data_location = onnx.TensorProto.EXTERNAL
    if cur: flush()
    onnx.save(m, f"{out}/onnx/{base}")
    chunks[base] = len(files)
    print(base, os.path.getsize(f"{out}/onnx/{base}"), files, flush=True)
for f in ["config.json", "generation_config.json"]:
    shutil.copy(f"{src}/{f}", f"{out}/{f}")
cfg = json.load(open(f"{out}/config.json"))
cfg["transformers.js_config"] = {"dtype": "q8", "use_external_data_format": chunks}
json.dump(cfg, open(f"{out}/config.json", "w"), indent=2)
print("chunks", chunks)
