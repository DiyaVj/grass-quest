from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from mlx_vlm import load, generate
from mlx_vlm.prompt_utils import apply_chat_template
import tempfile
import json
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "mlx-community/SmolVLM2-2.2B-Instruct-mlx"

print("Loading model...")
model, processor = load(MODEL_PATH)
print("Model loaded!")


@app.get("/")
def root():
    return {
        "status": "GrassQuest AI is running"
    }


@app.post("/analyze")
async def analyze(
    image: UploadFile = File(...),
    challenge: str = Form(...)
):
    # Save uploaded image temporarily
    suffix = image.filename.split(".")[-1] if image.filename else "jpg"

    with tempfile.NamedTemporaryFile(
        suffix=f".{suffix}",
        delete=False
    ) as temp:
        temp.write(await image.read())
        image_path = temp.name

    prompt = f"""
You are the vision validator for GrassQuest,
an outdoor scavenger hunt.

The user's current challenge is:

"{challenge}"

Look carefully at the image and determine whether
the image satisfies the challenge.

Return ONLY valid JSON in exactly this format:

{{
  "match": true or false,
  "confidence": number between 0 and 1,
  "reason": "short explanation"
}}

Do not include markdown.
Do not include any text outside the JSON.
"""

    formatted_prompt = apply_chat_template(
        processor,
        model.config,
        prompt,
        num_images=1
    )

    output = generate(
        model,
        processor,
        formatted_prompt,
        image=image_path,
        max_tokens=150,
        temperature=0.0,
    )

    # Extract JSON from model response
    match = re.search(r"\{.*\}", output, re.DOTALL)

    if not match:
        return {
            "success": False,
            "error": "Model did not return valid JSON",
            "raw_output": output
        }

    try:
        result = json.loads(match.group())
    except json.JSONDecodeError:
        return {
            "success": False,
            "error": "Could not parse model response",
            "raw_output": output
        }

    return {
        "success": True,
        **result
    }