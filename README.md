# 🌿 GrassQuest

> **What if the best AI app was one you were supposed to stop using?**

GrassQuest is an **offline-first AI nature scavenger hunt** that uses a local open-weight vision model to send people outside, verify what they discover, and then tell them to put their phone away.

Built for the **Hacktoberfest Open-Source AI Challenge — Touch Grass**.

---

## 🌱 The Idea

Most AI products are designed to keep you on a screen.

GrassQuest is designed to do the opposite.

The app gives you a real-world nature mission:

> 🍃 **Find a leaf.**

You go outside and find one.

You take a photo.

A locally running open-weight AI model looks at the image and determines whether the required object is actually visible.

If you succeed:

> 🎉 **Challenge Complete!**
> +10 XP
>
> 📱 → 🌳
> **Put your phone away.**

The screen is intentionally the **shortest part of the experience**.

---

## 🎯 Why Touch Grass?

The goal of this challenge is to build AI that gets people **off the screen and into the world**.

GrassQuest treats AI differently:

**AI isn't the destination.**

It's the tiny bridge between a digital challenge and a real-world activity.

The ideal interaction is:

```text
Open app
   ↓
Get a challenge
   ↓
Go outside
   ↓
Find something
   ↓
Take one photo
   ↓
Local AI verifies it
   ↓
Earn XP
   ↓
📱 Put the phone away
   ↓
🌳 Actually experience the world
```

---

# 🤖 Open-Weight AI at the Core

GrassQuest uses:

**SmolVLM2-2.2B-Instruct**

running locally through:

**MLX + mlx-vlm**

The model runs on the user's machine instead of sending images to a hosted vision API.

### Architecture

```text
                    GrassQuest
                        │
                        ▼
                  Next.js PWA
                        │
                  Photo captured
                        │
                        ▼
                   FastAPI API
                        │
                        ▼
                  MLX / mlx-vlm
                        │
                        ▼
             SmolVLM2-2.2B-Instruct
                        │
                        ▼
              Structured observation
                        │
                        ▼
              Deterministic validation
                        │
                        ▼
                  Challenge result
```

---

# 🔓 Why Open Innovation Matters

Using an open-weight model isn't just a technical choice for GrassQuest.

It directly changes what the product can do.

### 🔒 Privacy

Nature photos can contain people, homes, locations, or other personal information.

GrassQuest doesn't need to upload those images to a third-party AI service.

The vision inference happens locally.

### 📴 Offline Potential

Because the model runs locally, the core AI experience doesn't require a cloud AI API.

That opens the possibility of using GrassQuest in places where connectivity is limited — parks, hiking trails, gardens, campsites, or other outdoor environments.

### 💰 No Per-Image API Cost

There is no cloud vision API charge for every photo analyzed.

Once the model is available locally, inference can happen without a per-request AI bill.

### 🔄 Model Freedom

The model isn't permanently tied to a proprietary API.

The perception layer can be replaced with another compatible open-weight vision model as models improve.

### 🧠 More Control

We control the relationship between AI perception and application logic.

This became particularly important during development.

---

# 🧪 An Interesting Problem We Found

Our first implementation asked the vision model something like:

> "Does this image satisfy the challenge?"

It seemed simple.

But it produced an important problem.

For example, when the challenge was:

> **Find a naturally shaped rock.**

A selfie containing a person could result in the model incorrectly deciding that a rock was present.

The model was trying to **reason about the answer**, rather than simply reporting what it could see.

### The solution

We separated **perception** from **decision making**.

Instead of asking the model:

> "Did the user complete the challenge?"

we ask it:

> "Look specifically for the required object. Is it visible? How many are visible?"

The model produces structured observations:

```json
{
  "target": "leaf",
  "visible": true,
  "count": 2,
  "evidence": "two green leaves are clearly visible"
}
```

Then deterministic Python code evaluates the actual game rule:

```text
observed count >= required count
        ↓
      PASS
```

This makes the system more predictable and gives the application control over the final decision.

---

# 🎮 Game Mechanics

GrassQuest isn't just a one-shot AI demo.

It has a lightweight progression system stored locally in the browser.

### XP

Different challenges reward different amounts of XP.

| Difficulty | Example          | XP |
| ---------- | ---------------- | -: |
| 🟢 Easy    | Find a leaf      | 10 |
| 🟡 Medium  | Find two leaves  | 15 |
| 🟡 Medium  | Find a bird      | 20 |
| 🔴 Hard    | Find a butterfly | 25 |

### 🌿 Levels

|    XP | Level                      |
| ----: | -------------------------- |
|     0 | 🌱 Touching Grass          |
|    50 | 🌿 Grass Rookie            |
|   100 | 🍃 Nature Spotter          |
|   250 | 🌳 Outdoor Explorer        |
|   500 | 🌲 Grass Veteran           |
| 1,000 | 🌎 Certified Touch-Grasser |

### 🔥 Streaks

Complete a quest on consecutive days to build an outdoor streak.

### 🏆 Milestones

Reaching XP milestones unlocks achievements such as:

> 🍃 **Nature Spotter unlocked!**

### 🎲 Challenge Selection

Users can:

* Start a random quest
* Shuffle the current challenge
* Choose a specific challenge
* Move directly to the next quest

The goal is to make the experience playful without turning it into another endless-scroll app.

---

# 🌿 Current Challenges

The current challenge pool includes:

* 🍃 Find a leaf
* 🌸 Find a flower
* 🪨 Find a rock
* 🌱 Find a plant
* 🌳 Find a tree
* 🍃 Find two leaves
* ☁️ Find a cloud
* 🐦 Find a bird
* 🐕 Find a dog
* 🐈 Find a cat
* 🦋 Find a butterfly

The challenge system is designed to be extensible.

Future missions can include visual attributes such as:

* Find a leaf with serrated edges
* Find a flower with at least five petals
* Find something naturally yellow
* Find something rough
* Find three different shades of green

These challenges can use the same **AI perception → deterministic validation** architecture.

---

# 🛠️ Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Browser Camera API

### AI

* SmolVLM2-2.2B-Instruct
* MLX
* mlx-vlm
* Local inference

### Backend

* Python
* FastAPI
* Uvicorn

### Storage

* Browser `localStorage`

No database is required for the current version.

---

# 📁 Project Structure

```text
grass-quest/
│
├── ai/
│   ├── .venv/
│   ├── server.py
│   └── test.py
│
└── web/
    ├── app/
    │   ├── page.tsx
    │   ├── challenges.ts
    │   └── game.ts
    │
    ├── public/
    ├── package.json
    └── ...
```

---

# 🚀 Running GrassQuest Locally

## Prerequisites

You'll need:

* Node.js
* Python 3
* A machine capable of running the selected MLX model
* A browser with camera access

The current local AI setup is optimized for Apple Silicon using MLX.

---

## 1. Start the AI server

Navigate to the AI directory:

```bash
cd ai
```

Create the environment:

```bash
python3 -m venv .venv
```

Activate it:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -U mlx-vlm
pip install fastapi uvicorn python-multipart
```

Start the server:

```bash
uvicorn server:app --reload --port 8000
```

You should see:

```text
Loading model...
Model loaded!
```

The API will be available at:

```text
http://127.0.0.1:8000
```

---

## 2. Start the web app

In another terminal:

```bash
cd web
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Allow camera access when prompted.

---

# 🔐 Privacy

GrassQuest is designed around a local-first architecture.

The captured image is sent only to the locally running FastAPI service for inference.

There is currently:

* No user account
* No database
* No image upload service
* No external AI API
* No analytics requirement
* No cloud vision processing

Game progress is stored locally in the browser.

---

# 🌎 What Happens After You Win?

This is arguably the most important feature.

GrassQuest doesn't try to maximize the amount of time you spend inside the app.

After completing a challenge, the app says:

```text
🎉 Challenge Complete!

+10 XP

📱 → 🌳

Put your phone away.

Spend a few minutes actually
experiencing where you are.
```

The product is intentionally designed around **successful disengagement**.

If GrassQuest works, you should stop using GrassQuest.

---

# 🧪 Taking It Outside

One of the goals of this project is to test the experience in the real world rather than only in a development environment.

The intended test:

1. Take GrassQuest outside.
2. Start a random quest.
3. Find the requested object.
4. Capture it.
5. Let the local model verify it.
6. Earn XP.
7. Put the phone away.

The real test isn't whether someone can complete the challenge.

It's whether the app successfully gets them to **stop looking at the app afterward**.

---

# 🔮 Future Ideas

Possible future directions include:

* More sophisticated visual challenges
* Offline PWA support
* Fully offline model loading
* Bird and plant identification
* Nature sound challenges
* Location-independent outdoor quests
* Timed "put your phone away" challenges
* Daily quests
* More detailed visual attributes
* Custom challenge creation
* Additional open-weight vision models
* Model benchmarking

The architecture intentionally keeps the model layer replaceable so different open-weight models can be tested as they improve.

---

# 💡 Why I Built This

AI is increasingly good at helping us do things faster.

But not everything needs to be faster.

Sometimes the best outcome of an AI interaction is for the user to **stop interacting with the AI**.

GrassQuest explores that idea:

> **Can we use AI to help people spend less time with technology rather than more?**

And by using open-weight AI locally, the experience can remain private, inexpensive, customizable, and potentially usable without an internet connection.

---

# 🏁 Built For

**Hacktoberfest Open-Source AI Challenge — Touch Grass**

> Build something with open-weight models or open-source AI that gets people off the screen and into the world.

🌿 **GrassQuest**

**AI gives you the mission.
The real world gives you the answer.**
