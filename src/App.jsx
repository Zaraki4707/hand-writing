import React, { useEffect, useRef, useState } from "react";

const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
];

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.crossOrigin = "anonymous";
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function HandWritingPen() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const stateRef = useRef({
    arr: [],
    cur: [],
    shift: false,
    draw: false,
    sx: null,
    sy: null,
  });
  const [status, setStatus] = useState("Loading MediaPipe...");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cam;
    const prevBodyMargin = document.body.style.margin;
    const prevBodyBackground = document.body.style.background;
    document.body.style.margin = "0";
    document.body.style.background = "#050301";

    async function init() {
      try {
        setStatus("Requesting camera access...");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());

        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");

        if (
          !window.Hands ||
          !window.Camera ||
          !window.drawConnectors ||
          !window.drawLandmarks
        ) {
          throw new Error("MediaPipe failed to load. Refresh and try again.");
        }

        setStatus("Initializing camera...");

        const vid = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const s = stateRef.current;

        function run(res) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;

          ctx.drawImage(res.image, 0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "rgba(10, 6, 2, 0.85)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.shadowColor = "#F5D061";
          ctx.shadowBlur = 15;
          ctx.strokeStyle = "#F5D061";
          ctx.lineWidth = 6;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          for (let i = 0; i < s.arr.length; i++) {
            ctx.beginPath();
            for (let j = 0; j < s.arr[i].length; j++) {
              if (j === 0) ctx.moveTo(s.arr[i][j].x, s.arr[i][j].y);
              else ctx.lineTo(s.arr[i][j].x, s.arr[i][j].y);
            }
            ctx.stroke();
          }

          if (res.multiHandLandmarks && res.multiHandLandmarks.length > 0) {
            const lm = res.multiHandLandmarks[0];
            window.drawConnectors(ctx, lm, HAND_CONNECTIONS, {
              color: "rgba(245, 208, 97, 0.3)",
              lineWidth: 2,
            });
            window.drawLandmarks(ctx, lm, {
              color: "#FFFFFF",
              lineWidth: 1,
              radius: 2,
            });

            const ind = lm[8];
            const rx = ind.x * canvas.width;
            const ry = ind.y * canvas.height;

            if (s.sx == null) {
              s.sx = rx;
              s.sy = ry;
            } else {
              s.sx += (rx - s.sx) * 0.45;
              s.sy += (ry - s.sy) * 0.45;
            }

            ctx.beginPath();
            ctx.arc(s.sx, s.sy, 6, 0, 2 * Math.PI);
            ctx.shadowBlur = 0;
            ctx.fillStyle = s.shift ? "#FFFFFF" : "rgba(245, 208, 97, 0.4)";
            ctx.fill();

            if (s.shift) {
              if (!s.draw) {
                s.draw = true;
                s.cur = [];
                s.arr.push(s.cur);
              }
              s.cur.push({ x: s.sx, y: s.sy });
            } else {
              s.draw = false;
            }
          } else {
            s.draw = false;
            s.sx = null;
            s.sy = null;
          }
        }

        const hands = new window.Hands({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        hands.onResults(run);

        cam = new window.Camera(vid, {
          onFrame: async () => {
            await hands.send({ image: vid });
          },
          width: 1280,
          height: 720,
        });

        cam.start().catch((err) => {
          if (
            err.name === "NotAllowedError" ||
            err.name === "PermissionDeniedError"
          ) {
            setStatus(
              "Camera access denied. Please allow camera permissions in your browser and refresh."
            );
          } else {
            setStatus("Error starting camera: " + err.message);
          }
        });
        setReady(true);
        setStatus("");
      } catch (e) {
        if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
          setStatus(
            "Camera access denied. Please allow camera permissions in your browser and refresh."
          );
        } else {
          setStatus("Error: " + e.message);
        }
      }
    }

    init();

    const onKeyDown = (e) => {
      if (e.key === "Shift") stateRef.current.shift = true;
      if (e.code === "Space") stateRef.current.arr = [];
    };
    const onKeyUp = (e) => {
      if (e.key === "Shift") stateRef.current.shift = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (cam) cam.stop?.();
      document.body.style.margin = prevBodyMargin;
      document.body.style.background = prevBodyBackground;
    };
  }, []);

  return (
    <div
      style={{
        margin: 0,
        background: "#050301",
        overflow: "hidden",
        width: "100vw",
        height: "100vh",
        position: "relative",
      }}
    >
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          transform: "scaleX(-1)",
          position: "absolute",
          zIndex: 1,
        }}
      />
      {status && (
        <div
          style={{
            position: "absolute",
            zIndex: 10,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#F5D061",
            fontFamily: "serif",
            fontSize: "1.2rem",
            letterSpacing: "0.1em",
            textAlign: "center",
            textShadow: "0 0 20px #F5D061",
          }}
        >
          {status}
        </div>
      )}
      {ready && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            color: "rgba(245, 208, 97, 0.5)",
            fontFamily: "serif",
            fontSize: "0.8rem",
            letterSpacing: "0.2em",
            textAlign: "center",
          }}
        >
          HOLD SHIFT to draw · SPACE to clear
        </div>
      )}
    </div>
  );
}