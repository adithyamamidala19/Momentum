# Background Media Files

Place your botanical looping video files here.

## Required Files

| File            | Format | Purpose                              |
|-----------------|--------|--------------------------------------|
| `bg-loop.webm`  | WebM   | Primary: best quality, small size    |
| `bg-loop.mp4`   | MP4    | Fallback: for browsers without WebM  |
| `bg-poster.jpg` | JPEG   | Static poster shown on mobile / slow |

## Specs

- Resolution: 1920×1080 (1080p) or lower (720p is fine)
- Duration: 8–15 seconds, **seamlessly loopable**
- File size: Under 3MB total (WebM + MP4 combined)
- Bit rate: ~500–800 kbps for WebM is ideal
- Color: muted, desaturated (the overlay will warm it further)

## Free Sources

Search for **"botanical leaves loop"** or **"sunlight foliage loop"** on:

- **Pexels** — https://www.pexels.com/videos/
- **Coverr** — https://coverr.co/
- **Mixkit** — https://mixkit.co/free-stock-video/

## Conversion (if you only have MP4)

Use FFmpeg to create the WebM version:

```bash
ffmpeg -i your-video.mp4 -c:v libvpx-vp9 -b:v 600k -an bg-loop.webm
```

And extract a poster frame (frame at 2 seconds):
```bash
ffmpeg -i your-video.mp4 -ss 00:00:02 -vframes 1 bg-poster.jpg
```

## Without Files

If these files are missing, the site automatically falls back to a
beautiful animated CSS gradient mesh (sage + cream + peach) — nothing breaks.

## Tweaking the Look

All overlay settings are in `/src/motionConfig.js`:

```js
BG.videoOverlayOpacity = 0.88  // Higher = more cream, less video visible
BG.videoBlur = '3px'           // Blur applied to the video (atmospheric)
```
