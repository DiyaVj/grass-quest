from mlx_vlm import load, generate
from mlx_vlm.prompt_utils import apply_chat_template

MODEL_PATH = "mlx-community/SmolVLM2-2.2B-Instruct-mlx"

model, processor = load(MODEL_PATH)

image = "./image.png"

challenge = "Find a leaf with serrated edges."

prompt = f"""
You are the vision validator for GrassQuest, an outdoor scavenger hunt.

The user's current challenge is:

"{challenge}"

Look carefully at the image and determine whether the image satisfies the challenge.

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
    image=image,
    max_tokens=150,
    temperature=0.0,
)

print(output)