Scroll Turntable sequence frames

After generating a 360° turntable sequence (AI, Blender, etc.):

1. Name frames frame-001.webp, frame-002.webp … (three digits, starting at 001) in this directory.
   - Recommend 60–120 frames; more frames = smoother scrub
   - Recommend webp, ~1200px wide, to control total size
   - All frames same size and camera; only object rotation changes (360° / frame count per step)

2. Open src/components/playground/TurntableDemo.tsx
   and change FRAME_COUNT at the top from 0 to the actual count (e.g. 60).

The card will switch from procedural point-cloud sphere to real sequence frames; scroll to scrub rotation.

AI turntable workflow:
- Generate a front-facing hero still of the object
- Use image-to-video (Kling / Runway / Veo, etc.) with prompt: "camera orbits 360 degrees around the object, fixed framing, seamless loop"
- Extract frames with ffmpeg: ffmpeg -i turntable.mp4 -vf "fps=N/duration" frame-%03d.webp
