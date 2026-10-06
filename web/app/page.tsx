"use client";

import { useEffect, useRef, useState } from "react";

import {
  CHALLENGES,
  Challenge,
  getRandomChallenge,
} from "./challenges";

import {
  GameState,
  completeChallenge,
  getCurrentLevel,
  getLevelProgress,
  getNewlyUnlockedMilestone,
  loadGame,
  MILESTONES,
} from "./game";

type Result = {
  success: boolean;
  match?: boolean;
  confidence?: number;
  reason?: string;
  error?: string;
};

export default function Home() {
  const videoRef =
    useRef<HTMLVideoElement>(null);

  const canvasRef =
    useRef<HTMLCanvasElement>(null);

  const [started, setStarted] =
    useState(false);

  const [cameraOpen, setCameraOpen] =
    useState(false);

  const [image, setImage] =
    useState<string | null>(null);

  const [result, setResult] =
    useState<Result | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [challenge, setChallenge] =
    useState<Challenge | null>(null);

  const [game, setGame] =
    useState<GameState | null>(null);

  const [showChallenges, setShowChallenges] =
    useState(false);

  const [milestoneMessage, setMilestoneMessage] =
    useState<string | null>(null);

  useEffect(() => {
    setGame(loadGame());
  }, []);

  function startQuest(
    selectedChallenge?: Challenge
  ) {
    const selected =
      selectedChallenge ??
      getRandomChallenge(
        challenge?.id
      );

    setChallenge(selected);
    setStarted(true);
    setImage(null);
    setResult(null);
    setCameraOpen(false);
    setShowChallenges(false);
    setMilestoneMessage(null);
  }

  function shuffleChallenge() {
    const next =
      getRandomChallenge(
        challenge?.id
      );

    setChallenge(next);
    setImage(null);
    setResult(null);
    setCameraOpen(false);
  }

  function chooseChallenge(
    selected: Challenge
  ) {
    setChallenge(selected);
    setImage(null);
    setResult(null);
    setCameraOpen(false);
    setShowChallenges(false);
  }

  async function openCamera() {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "environment",
            },
            width: {
              ideal: 1280,
            },
            height: {
              ideal: 720,
            },
          },
          audio: false,
        });

      setCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;

          videoRef.current
            .play()
            .catch((error) => {
              console.error(
                "Video play failed:",
                error
              );
            });
        }
      }, 100);
    } catch (error) {
      console.error(
        "Camera error:",
        error
      );

      alert(
        "Could not access the camera. Please check your browser camera permissions."
      );
    }
  }

  function capturePhoto() {
    const video =
      videoRef.current;

    const canvas =
      canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    if (
      video.readyState < 2 ||
      video.videoWidth === 0
    ) {
      alert(
        "Camera is still starting. Try again in a moment."
      );

      return;
    }

    canvas.width =
      video.videoWidth;

    canvas.height =
      video.videoHeight;

    const context =
      canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const photo =
      canvas.toDataURL(
        "image/jpeg",
        0.9
      );

    setImage(photo);

    const stream =
      video.srcObject as MediaStream | null;

    if (stream) {
      stream
        .getTracks()
        .forEach((track) =>
          track.stop()
        );
    }

    video.srcObject = null;

    setCameraOpen(false);
  }

  async function analyzePhoto() {
    if (!image || !challenge) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response =
        await fetch(image);

      const blob =
        await response.blob();

      const formData =
        new FormData();

      formData.append(
        "image",
        blob,
        "grassquest.jpg"
      );

      formData.append(
        "challenge",
        challenge.text
      );

      const apiResponse =
        await fetch(
          "http://127.0.0.1:8000/analyze",
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await apiResponse.json();

      setResult(data);

      if (data.match && game) {
        const oldXP = game.xp;

        const updatedGame =
          completeChallenge(
            game,
            challenge.id,
            challenge.xp
          );

        setGame(updatedGame);

        const milestone =
          getNewlyUnlockedMilestone(
            oldXP,
            updatedGame.xp
          );

        if (milestone) {
          setMilestoneMessage(
            `${milestone.emoji} ${milestone.name} unlocked!`
          );
        }
      }
    } catch (error) {
      console.error(
        "Analysis error:",
        error
      );

      setResult({
        success: false,
        error:
          "Could not connect to the GrassQuest AI server.",
      });
    } finally {
      setLoading(false);
    }
  }

  function retakePhoto() {
    setImage(null);
    setResult(null);
    openCamera();
  }

  function finishQuest() {
    const video =
      videoRef.current;

    if (video?.srcObject) {
      const stream =
        video.srcObject as MediaStream;

      stream
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      video.srcObject = null;
    }

    setStarted(false);
    setCameraOpen(false);
    setImage(null);
    setResult(null);
    setChallenge(null);
    setShowChallenges(false);
    setMilestoneMessage(null);
  }

  const currentLevel = game
    ? getCurrentLevel(game.xp)
    : null;

  const levelProgress = game
    ? getLevelProgress(game.xp)
    : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white px-5 py-8">
      <div className="mx-auto flex min-h-[90vh] max-w-md flex-col">

        {/* HEADER */}

        <header className="mb-6 text-center">
          <div className="mb-2 text-5xl">
            🌿
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-green-900">
            GrassQuest
          </h1>

          <p className="mt-2 text-sm text-green-700">
            AI gives you the mission.
            <br />
            The real world gives you the answer.
          </p>
        </header>

        {/* GAME STATS */}

        {game && (
          <div className="mb-6 rounded-3xl bg-white p-5 shadow-md">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-green-600">
                  {currentLevel?.emoji}{" "}
                  {currentLevel?.name}
                </p>

                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {game.xp} XP
                </p>
              </div>

              <div className="text-right">
                <p className="text-xl font-bold">
                  🔥 {game.streak}
                </p>

                <p className="text-xs text-gray-500">
                  day streak
                </p>
              </div>

            </div>

            {levelProgress && (
              <>
                <div className="mt-4 flex justify-between text-xs text-gray-500">
                  <span>
                    Level progress
                  </span>

                  <span>
                    {levelProgress.next
                      ? `${game.xp} / ${levelProgress.next.minXP} XP`
                      : "MAX LEVEL"}
                  </span>
                </div>

                <div className="mt-2 h-3 overflow-hidden rounded-full bg-green-100">
                  <div
                    className="h-full rounded-full bg-green-600 transition-all duration-500"
                    style={{
                      width: `${levelProgress.progress}%`,
                    }}
                  />
                </div>
              </>
            )}

            <div className="mt-4 flex justify-between text-xs text-gray-500">
              <span>
                🌱 {game.completedChallenges} quests completed
              </span>

              <span>
                🏆{" "}
                {
                  MILESTONES.filter(
                    (m) =>
                      game.xp >= m.xp
                  ).length
                }{" "}
                milestones
              </span>
            </div>
          </div>
        )}

        {/* HOME */}

        {!started && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">

            <div className="mb-8 rounded-3xl bg-white p-8 shadow-lg">

              <div className="mb-5 text-6xl">
                🌳
              </div>

              <h2 className="text-2xl font-bold text-gray-900">
                Touch some grass.
              </h2>

              <p className="mt-3 leading-6 text-gray-600">
                Step outside, complete a
                real-world mission and earn
                XP.
              </p>

            </div>

            <button
              onClick={() =>
                startQuest()
              }
              className="w-full rounded-2xl bg-green-700 px-6 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-green-800 active:scale-[0.98]"
            >
              Start Quest 🌱
            </button>

            <button
              onClick={() =>
                startQuest(
                  getRandomChallenge()
                )
              }
              className="mt-3 w-full rounded-2xl border border-green-200 bg-white px-6 py-3 font-semibold text-green-800 transition hover:bg-green-50"
            >
              🎲 Surprise Me
            </button>

            <p className="mt-4 text-xs text-gray-500">
              No account. No cloud AI.
              <br />
              Your image stays local.
            </p>
          </div>
        )}

        {/* QUEST */}

        {started &&
          challenge && (
            <div className="flex flex-1 flex-col">

              {/* CHALLENGE CARD */}

              <div className="mb-5 rounded-3xl bg-white p-6 shadow-md">

                <div className="flex items-start justify-between">

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-600">
                      Your mission
                    </p>

                    <h2 className="text-2xl font-bold leading-tight text-gray-900">
                      {challenge.emoji}{" "}
                      {challenge.text}
                    </h2>
                  </div>

                  <div className="ml-3 shrink-0 rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
                    +{challenge.xp} XP
                  </div>

                </div>

                <div className="mt-4 flex items-center justify-between">

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      challenge.difficulty ===
                      "easy"
                        ? "bg-green-100 text-green-700"
                        : challenge.difficulty ===
                          "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {challenge.difficulty ===
                    "easy"
                      ? "🟢 Easy"
                      : challenge.difficulty ===
                        "medium"
                      ? "🟡 Medium"
                      : "🔴 Hard"}
                  </span>

                  <button
                    onClick={
                      shuffleChallenge
                    }
                    className="text-sm font-semibold text-green-700 hover:text-green-900"
                  >
                    🔀 Shuffle
                  </button>

                </div>

              </div>

              {/* CHANGE CHALLENGE */}

              <button
                onClick={() =>
                  setShowChallenges(
                    !showChallenges
                  )
                }
                className="mb-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700"
              >
                {showChallenges
                  ? "Hide Challenges"
                  : "✏️ Choose a Different Challenge"}
              </button>

              {showChallenges && (
                <div className="mb-5 max-h-72 space-y-2 overflow-y-auto rounded-2xl bg-gray-50 p-3">

                  {CHALLENGES.map(
                    (item) => (
                      <button
                        key={item.id}
                        onClick={() =>
                          chooseChallenge(
                            item
                          )
                        }
                        className={`w-full rounded-xl p-3 text-left transition ${
                          item.id ===
                          challenge.id
                            ? "bg-green-100"
                            : "bg-white hover:bg-green-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">

                          <span className="font-medium text-gray-800">
                            {item.emoji}{" "}
                            {item.text}
                          </span>

                          <span className="text-xs font-bold text-green-700">
                            +{item.xp}
                          </span>

                        </div>

                      </button>
                    )
                  )}

                </div>
              )}

              {/* CAMERA */}

              {!image &&
                !result && (
                  <div className="flex flex-1 flex-col">

                    {!cameraOpen ? (
                      <div className="flex flex-1 flex-col items-center justify-center rounded-3xl bg-green-100 p-8 text-center">

                        <div className="mb-5 text-6xl">
                          📷
                        </div>

                        <h3 className="text-xl font-bold text-green-900">
                          Ready to find it?
                        </h3>

                        <p className="mb-6 mt-2 text-sm text-green-700">
                          Go outside and show
                          GrassQuest what you
                          found.
                        </p>

                        <button
                          onClick={
                            openCamera
                          }
                          className="w-full rounded-2xl bg-green-700 px-6 py-4 font-semibold text-white shadow-md transition hover:bg-green-800 active:scale-[0.98]"
                        >
                          Open Camera
                        </button>

                      </div>
                    ) : (
                      <div className="flex flex-1 flex-col">

                        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-black">

                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="absolute inset-0 h-full w-full object-cover"
                          />

                        </div>

                        <button
                          onClick={
                            capturePhoto
                          }
                          className="mt-5 w-full rounded-2xl bg-green-700 px-6 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-green-800 active:scale-[0.98]"
                        >
                          Take Photo 📸
                        </button>

                      </div>
                    )}
                  </div>
                )}

              {/* PHOTO */}

              {image &&
                !result && (
                  <div className="flex flex-1 flex-col">

                    <div className="overflow-hidden rounded-3xl bg-black shadow-md">
                      <img
                        src={image}
                        alt="Your discovery"
                        className="w-full object-cover"
                      />
                    </div>

                    <button
                      onClick={
                        analyzePhoto
                      }
                      disabled={loading}
                      className="mt-5 w-full rounded-2xl bg-green-700 px-6 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading
                        ? "AI is checking... 🤖"
                        : `Check Discovery · +${challenge.xp} XP ✨`}
                    </button>

                    <button
                      onClick={
                        retakePhoto
                      }
                      disabled={loading}
                      className="mt-3 w-full rounded-2xl border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                      Retake Photo
                    </button>

                  </div>
                )}

              {/* RESULT */}

              {result && (
                <div className="flex flex-1 flex-col">

                  {result.match ? (
                    <div className="rounded-3xl bg-green-100 p-7 text-center">

                      <div className="mb-4 text-7xl">
                        🎉
                      </div>

                      <h2 className="text-3xl font-bold text-green-900">
                        Challenge Complete!
                      </h2>

                      <p className="mt-4 text-lg text-green-800">
                        {result.reason}
                      </p>

                      <div className="mt-6 rounded-2xl bg-white p-5">

                        <p className="text-3xl font-bold text-green-700">
                          +{challenge.xp} XP
                        </p>

                        <p className="mt-2 text-sm text-gray-500">
                          🌱 Mission accomplished
                        </p>

                      </div>

                      {milestoneMessage && (
                        <div className="mt-4 rounded-2xl bg-yellow-100 p-4">

                          <p className="text-lg font-bold text-yellow-900">
                            🏆 Milestone!
                          </p>

                          <p className="mt-1 text-sm text-yellow-800">
                            {milestoneMessage}
                          </p>

                        </div>
                      )}

                      <div className="mt-6 rounded-2xl bg-green-900 p-5 text-white">

                        <p className="text-2xl">
                          📱 → 🌳
                        </p>

                        <p className="mt-2 font-bold">
                          Put your phone away.
                        </p>

                        <p className="mt-1 text-sm text-green-100">
                          Spend a few minutes
                          actually experiencing
                          where you are.
                        </p>

                      </div>

                    </div>
                  ) : (
                    <div className="rounded-3xl bg-orange-50 p-7 text-center">

                      <div className="mb-4 text-6xl">
                        🌱
                      </div>

                      <h2 className="text-3xl font-bold text-orange-900">
                        Not quite!
                      </h2>

                      <p className="mt-4 text-lg text-orange-800">
                        {result.reason ||
                          "The AI couldn't verify this discovery."}
                      </p>

                      <p className="mt-4 text-sm text-orange-700">
                        Try finding something
                        that matches the mission
                        more closely.
                      </p>

                    </div>
                  )}

                  <div className="mt-auto pt-6">

                    {result.match ? (
                      <div className="space-y-3">

                        <button
                          onClick={
                            () =>
                              startQuest()
                          }
                          className="w-full rounded-2xl bg-green-700 px-6 py-4 font-semibold text-white shadow-md transition hover:bg-green-800"
                        >
                          Next Quest 🌿
                        </button>

                        <button
                          onClick={
                            shuffleChallenge
                          }
                          className="w-full rounded-2xl border border-green-200 bg-white px-6 py-3 font-semibold text-green-800 transition hover:bg-green-50"
                        >
                          🔀 Shuffle Challenge
                        </button>

                        <button
                          onClick={
                            finishQuest
                          }
                          className="w-full rounded-2xl border border-gray-200 bg-white px-6 py-3 font-medium text-gray-600"
                        >
                          I'm Done 🌱
                        </button>

                      </div>
                    ) : (
                      <div className="space-y-3">

                        <button
                          onClick={
                            retakePhoto
                          }
                          className="w-full rounded-2xl bg-green-700 px-6 py-4 font-semibold text-white shadow-md transition hover:bg-green-800"
                        >
                          Try Again 📸
                        </button>

                        <button
                          onClick={
                            shuffleChallenge
                          }
                          className="w-full rounded-2xl border border-green-200 bg-white px-6 py-3 font-semibold text-green-800"
                        >
                          🔀 Try a Different Quest
                        </button>

                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          )}

        <canvas
          ref={canvasRef}
          className="hidden"
        />

        <footer className="mt-8 text-center text-xs text-gray-400">
          GrassQuest • Powered by local open-weight AI
        </footer>

      </div>
    </main>
  );
}