#!/bin/sh
# Usage: pipeline.sh SRC_MODEL_DIR NAME HUB_NAME   (e.g. /workspace/ft/r5/final r5base flan-t5-base)
# Rebuilds a clean HF dir (original config: tie_word_embeddings=false, original tokenizer), exports ONNX, quantizes q8, splits <=24 MiB.
set -e
cd /workspace/ft
SNAP=$(ls -d ~/.cache/huggingface/hub/models--google--$3/snapshots/*/ | head -1)
rm -rf fix-$2 onnx-$2 web-$2 && mkdir fix-$2
cp $1/model.safetensors fix-$2/ && cp $SNAP/config.json $SNAP/generation_config.json $SNAP/tokenizer.json $SNAP/tokenizer_config.json $SNAP/special_tokens_map.json fix-$2/
exp-venv/bin/optimum-cli export onnx --model fix-$2 --task text2text-generation-with-past onnx-$2 > export-$2.log 2>&1
exp-venv/bin/python /workspace/project-synergy-research/round5/export.py onnx-$2 web-$2 >> export-$2.log 2>&1
cp $SNAP/tokenizer.json $SNAP/tokenizer_config.json $SNAP/special_tokens_map.json web-$2/
du -sh web-$2; ls -la web-$2/onnx | awk '{print $5, $9}'
