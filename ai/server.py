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


def extract_json(output: str):
    match = re.search(r"\{.*\}", output, re.DOTALL)

    if not match:
        return None

    try:
        return json.loads(match.group())
    except json.JSONDecodeError:
        return None


# --------------------------------------------------
# CHALLENGE RULES
# --------------------------------------------------

CHALLENGES = {
    "Find a leaf.": {
        "object": "leaf",
        "count": 1,
    },
    "Find a flower.": {
        "object": "flower",
        "count": 1,
    },
    "Find a rock.": {
        "object": "rock",
        "count": 1,
    },
    "Find a plant.": {
        "object": "plant",
        "count": 1,
    },
    "Find a tree.": {
        "object": "tree",
        "count": 1,
    },
    "Find two leaves.": {
        "object": "leaf",
        "count": 2,
    },
    "Find a cloud.": {
        "object": "cloud",
        "count": 1,
    },
    "Find a bird.": {
        "object": "bird",
        "count": 1,
    },
    "Find a dog.": {
        "object": "dog",
        "count": 1,
    },
    "Find a cat.": {
        "object": "cat",
        "count": 1,
    },
    "Find a butterfly.": {
        "object": "butterfly",
        "count": 1,
    },
}

# Words that count as evidence for each object when they
# appear in the model's description. Objects not listed
# here fall back to their own name.
OBJECT_KEYWORDS = {
    "leaf": ["leaf", "leaves", "foliage"],
    "flower": ["flower", "blossom", "bloom", "petal", "rose", "daisy", "tulip", "sunflower"],
    "rock": ["rock", "stone", "pebble", "boulder"],
    "tree": ["tree", "trunk", "branch", "branches"],
    "plant": ["plant", "leaf", "leaves", "grass", "fern", "shrub", "bush", "flower", "tree", "moss", "weed", "succulent", "cactus", "sprout", "vine"],
    "cloud": ["cloud"],
    "bird": ["bird", "pigeon", "sparrow", "crow", "duck", "gull", "seagull", "robin", "parrot", "eagle", "hawk", "owl", "chicken", "goose", "geese", "swan"],
    "butterfly": ["butterfly", "butterflies", "moth"],
    "dog": ["dog", "puppy", "puppies"],
    "cat": ["cat", "kitten"],
}

@app.post("/analyze")
async def analyze(
    image: UploadFile = File(...),
    challenge: str = Form(...)
):

    # --------------------------------------------------
    # SAVE IMAGE
    # --------------------------------------------------

    suffix = (
        image.filename.split(".")[-1]
        if image.filename
        else "jpg"
    )

    with tempfile.NamedTemporaryFile(
        suffix=f".{suffix}",
        delete=False
    ) as temp:

        temp.write(await image.read())
        image_path = temp.name


    # --------------------------------------------------
    # GET CHALLENGE REQUIREMENTS
    # --------------------------------------------------

    rule = CHALLENGES.get(challenge)

    if not rule:

        return {
            "success": False,
            "match": False,
            "reason": "Unknown challenge."
        }


    required_object = rule["object"]
    required_count = rule["count"]


    # --------------------------------------------------
    # VISUAL OBSERVATION
    #
    # The model describes the image BEFORE answering,
    # and the example contains placeholders rather than
    # a filled-in answer, so a small model can't just
    # copy "visible: true" from the template.
    # --------------------------------------------------

    observation_prompt = f"""
    First describe what is actually in this image, then decide
    whether it contains a {required_object}.

    Do NOT assume the {required_object} exists just because you were asked.
    Only say it is visible if you can actually see it.
    It may be small, held by a person, or in the background.

    Return ONLY valid JSON with these keys, in this order:

    {{
    "evidence": "<one sentence describing the main things visible in the image>",
    "visible": <true or false>,
    "count": <number of {required_object} instances clearly visible, 0 if none>
    }}

    Do not include markdown.
    Do not include any text outside the JSON.
    """


    formatted_prompt = apply_chat_template(
        processor,
        model.config,
        observation_prompt,
        num_images=1
    )


    observation_output = generate(
        model,
        processor,
        formatted_prompt,
        image=image_path,
        max_tokens=200,
        temperature=0.0,
    )


    print("\n========== VISUAL OBSERVATION ==========")
    print(observation_output)
    print("========================================\n")


    observation = extract_json(observation_output)


    if not observation:

        return {
            "success": False,
            "match": False,
            "reason": "The AI could not understand the image.",
            "observed": []
        }


    # --------------------------------------------------
    # EXTRACT OBSERVED OBJECTS
    # --------------------------------------------------

    observed_count = int(
        observation.get("count", 0)
    )

    visible = observation.get(
        "visible",
        False
    )

    observed_count = max(
        0,
        observed_count
    )

    evidence = str(
        observation.get("evidence", "")
    )

    # --------------------------------------------------
    # DETERMINISTIC VALIDATION
    # --------------------------------------------------

    # Small models sometimes say "visible: true" while
    # their own description doesn't mention the object.
    # Require the description to back up the claim.
    keywords = OBJECT_KEYWORDS.get(
        required_object,
        [required_object]
    )

    evidence_supports = any(
        re.search(rf"\b{re.escape(k)}(s|es)?\b", evidence, re.IGNORECASE)
        for k in keywords
    )

    object_found = (
        visible is True
        and observed_count > 0
        and evidence_supports
    )

    enough_objects = (
        observed_count >= required_count
    )


    match = (
        object_found
        and enough_objects
    )


    # --------------------------------------------------
    # SPECIAL CASE:
    # TWO DIFFERENT TYPES OF LEAVES
    # --------------------------------------------------

    if challenge == "Find two different types of leaves.":

        # Our current visual observer only tells us
        # "leaf" counts, not leaf types.
        #
        # Therefore we deliberately DON'T claim success
        # unless we can actually verify two leaves.

        if observed_count >= 2:

            match = True

            reason = (
                "The image contains at least two leaves."
            )

        else:

            match = False

            reason = (
                "The image does not clearly contain "
                "two leaves."
            )

    else:

        if match:

            reason = (
                f"The image contains at least "
                f"{required_count} {required_object}."
            )

        else:

            reason = (
                f"The image does not clearly contain "
                f"the required {required_object}."
            )


    # --------------------------------------------------
    # FINAL RESULT
    # --------------------------------------------------

    print("\n========== FINAL DECISION ==========")

    print({
        "challenge": challenge,
        "required_object": required_object,
        "required_count": required_count,
        "observed_count": observed_count,
        "match": match
    })

    print("====================================\n")


    return {
        "success": True,
        "match": match,
        "confidence": 0.0,
        "reason": reason,
        "observed": [
            {
                "object": required_object,
                "count": observed_count,
                "evidence": evidence
            }
        ] if object_found else []
    }