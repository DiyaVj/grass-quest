"use client";

import { useRef, useState } from "react";

type Result = {
  success: boolean;
  match?: boolean;
  confidence?: number;
  reason?: string;
  error?: string;
};

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [started, setStarted] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const challenge = "Find a leaf with serrated edges.";

async function openCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    setCameraOpen(true);

    // Wait for the video element to render
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current
          .play()
          .catch((error) => {
            console.error("Video play failed:", error);
          });
      }
    }, 100);
  } catch (error) {
    console.error("Camera error:", error);

    alert(
      "Could not access the camera. Please check your browser camera permissions."
    );
  }
}

function capturePhoto() {
  const video = videoRef.current;
  const canvas = canvasRef.current;

  if (!video || !canvas) return;

  if (video.readyState < 2 || video.videoWidth === 0) {
    alert("Camera is still starting. Try again in a moment.");
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");
  if (!context) return;

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  setImage(canvas.toDataURL("image/jpeg", 0.9));

  // Stop the camera stream
  const stream = video.srcObject as MediaStream | null;
  stream?.getTracks().forEach((track) => track.stop());
  video.srcObject = null;

  setCameraOpen(false);
}

  function retakePhoto() {
    setImage(null);
    setResult(null);
    openCamera();
  }

  async function analyzePhoto() {
    if (!image) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(image);
      const blob = await response.blob();

      const formData = new FormData();

      formData.append(
        "image",
        blob,
        "grassquest.jpg"
      );

      formData.append(
        "challenge",
        challenge
      );

      const apiResponse = await fetch(
        "http://127.0.0.1:8000/analyze",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await apiResponse.json();

      setResult(data);
    } catch (error) {
      console.error(error);

      setResult({
        success: false,
        error: "Could not connect to GrassQuest AI.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-green-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">

        {!started && (
          <>
            <div className="text-6xl mb-6">
              🌱
            </div>

            <h1 className="text-5xl font-bold text-green-950">
              GrassQuest
            </h1>

            <p className="mt-4 text-lg text-green-800">
              AI missions for the real world.
            </p>

            <p className="mt-8 text-gray-600">
              Your AI gives you the mission.
              <br />
              The real world gives you the answer.
            </p>

            <button
              onClick={() => setStarted(true)}
              className="mt-10 w-full rounded-2xl bg-green-700 px-6 py-4 text-lg font-semibold text-white hover:bg-green-800"
            >
              Start Mission 🌿
            </button>
          </>
        )}

        {started && !cameraOpen && !image && !result && (
          <>
            <div className="text-5xl mb-6">
              🌿
            </div>

            <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
              Your Mission
            </p>

            <h1 className="mt-4 text-3xl font-bold text-green-950">
              {challenge}
            </h1>

            <p className="mt-6 text-gray-600">
              Go find it in the real world.
            </p>

            <button
              onClick={openCamera}
              className="mt-10 w-full rounded-2xl bg-green-700 px-6 py-4 text-lg font-semibold text-white hover:bg-green-800"
            >
              📷 Check My Find
            </button>

            <p className="mt-6 text-sm text-gray-500">
              Your phone should only be out for a moment.
            </p>
          </>
        )}

        {cameraOpen && (
          <>
            <p className="mb-4 text-lg font-semibold text-green-950">
              Find the leaf 👀
            </p>

            <div className="relative w-full overflow-hidden rounded-3xl bg-black aspect-[3/4]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>

            <button
              onClick={capturePhoto}
              className="mt-6 w-full rounded-2xl bg-green-700 px-6 py-4 text-lg font-semibold text-white"
            >
              📸 Take Photo
            </button>
          </>
        )}

        {image && !result && (
          <>
            <p className="mb-4 text-lg font-semibold text-green-950">
              Is this your find?
            </p>

            <img
              src={image}
              alt="Your find"
              className="w-full rounded-3xl"
            />

            <button
              onClick={analyzePhoto}
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-green-700 px-6 py-4 text-lg font-semibold text-white disabled:opacity-50"
            >
              {loading
                ? "🔎 Looking..."
                : "✨ Check My Find"}
            </button>

            <button
              onClick={retakePhoto}
              disabled={loading}
              className="mt-3 w-full rounded-2xl border border-green-700 px-6 py-4 text-lg font-semibold text-green-800"
            >
              Retake
            </button>
          </>
        )}

        {result && (
          <>
            {result.match ? (
              <>
                <div className="text-6xl mb-4">
                  🎉
                </div>

                <h1 className="text-3xl font-bold text-green-950">
                  Challenge Complete!
                </h1>

                <p className="mt-4 text-gray-700">
                  {result.reason}
                </p>

                <div className="mt-6 rounded-2xl bg-white p-5">
                  <p className="text-sm text-gray-500">
                    AI confidence
                  </p>

                  <p className="mt-1 text-3xl font-bold text-green-700">
                    {Math.round(
                      (result.confidence ?? 0) * 100
                    )}%
                  </p>
                </div>

                <div className="mt-8 rounded-2xl bg-green-900 p-6 text-white">
                  <p className="text-xl font-bold">
                    📱 Now put your phone away.
                  </p>

                  <p className="mt-2 text-green-100">
                    Look around and find something
                    else interesting.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">
                  🤔
                </div>

                <h1 className="text-3xl font-bold text-green-950">
                  Not quite!
                </h1>

                <p className="mt-4 text-gray-700">
                  {result.reason}
                </p>

                <button
                  onClick={retakePhoto}
                  className="mt-8 w-full rounded-2xl bg-green-700 px-6 py-4 text-lg font-semibold text-white"
                >
                  Try Again
                </button>
              </>
            )}

            <button
              onClick={() => {
                setStarted(false);
                setImage(null);
                setResult(null);
              }}
              className="mt-4 text-sm text-gray-500 underline"
            >
              End expedition
            </button>
          </>
        )}

        <canvas
          ref={canvasRef}
          className="hidden"
        />

      </div>
    </main>
  );
}