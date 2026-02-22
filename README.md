# Hand Writing Pen

A browser-based hand-tracking drawing app for writing anything in the air using your index finger.

## Features
- Real-time webcam hand tracking with MediaPipe Hands.
- Uses the index fingertip as a pen cursor.
- Hold `Shift` to draw, release to reposition.
- Press `Space` to clear all strokes.
- Smoothed pointer movement for cleaner writing.
- Mirrored canvas for natural camera interaction.
- Custom tab icon via `public/favicon.png`.

## Tech Stack
- React
- Vite
- MediaPipe Hands (loaded from CDN at runtime)

## Run Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start dev server:
   ```bash
   npm run dev
   ```
3. Open the URL shown in terminal (for example `http://localhost:5173`).

## Build
```bash
npm run build
```

## Camera Permission
The app requests camera access on startup. If permission is denied, the app shows a clear error message.

If camera is blocked:
- Chrome/Edge: click the camera icon in the address bar and allow access.
- Firefox: click the lock/camera icon and unblock camera.
- Safari: Website Settings → Camera → Allow.

Important:
- Camera access works on `localhost` or `https://`.
- Do not open `index.html` directly with `file://`.
