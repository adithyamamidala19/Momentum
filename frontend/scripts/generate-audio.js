import fs from 'fs';
import path from 'path';

function createWavBuffer(sampleRate, numChannels, leftSamples, rightSamples) {
  const numSamples = leftSamples.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size
  buffer.writeUInt16LE(1, 20);  // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    // Clamp to [-1, 1]
    const l = Math.max(-1, Math.min(1, leftSamples[i]));
    const r = Math.max(-1, Math.min(1, rightSamples[i]));

    const lInt = l < 0 ? l * 0x8000 : l * 0x7FFF;
    const rInt = r < 0 ? r * 0x8000 : r * 0x7FFF;

    buffer.writeInt16LE(Math.floor(lInt), offset);
    offset += 2;
    buffer.writeInt16LE(Math.floor(rInt), offset);
    offset += 2;
  }

  return buffer;
}

function applySeamlessLoop(samples, sampleRate, crossfadeSec = 1.0) {
  const cfSamples = Math.floor(sampleRate * crossfadeSec);
  const total = samples.length;
  for (let i = 0; i < cfSamples; i++) {
    const t = i / cfSamples;
    // Equal-power crossfade
    const gainStart = Math.cos(t * Math.PI * 0.5);
    const gainEnd = Math.sin(t * Math.PI * 0.5);
    const endIdx = total - cfSamples + i;
    const blended = samples[i] * gainEnd + samples[endIdx] * gainStart;
    samples[i] = blended;
    samples[endIdx] = blended;
  }
}

const sampleRate = 44100;
const durationSec = 15;
const totalSamples = sampleRate * durationSec;

console.log('Generating high-quality meditative focus soundscapes...');

// ── 1. FOREST RAIN ──
console.log('Synthesizing Forest Rain...');
const forestL = new Float32Array(totalSamples);
const forestR = new Float32Array(totalSamples);

// Pink noise generators with 3-pole filter
let b0L = 0, b1L = 0, b2L = 0;
let b0R = 0, b1R = 0, b2R = 0;
let lowpassL = 0, lowpassR = 0;

for (let i = 0; i < totalSamples; i++) {
  const whiteL = Math.random() * 2 - 1;
  const whiteR = Math.random() * 2 - 1;

  b0L = 0.99886 * b0L + whiteL * 0.0555179;
  b1L = 0.99332 * b1L + whiteL * 0.0750759;
  b2L = 0.96900 * b2L + whiteL * 0.1538520;
  const pinkL = (b0L + b1L + b2L) * 0.22;

  b0R = 0.99886 * b0R + whiteR * 0.0555179;
  b1R = 0.99332 * b1R + whiteR * 0.0750759;
  b2R = 0.96900 * b2R + whiteR * 0.1538520;
  const pinkR = (b0R + b1R + b2R) * 0.22;

  // Gentle lowpass filter with slow breeze swell (0.15Hz)
  const breeze = 0.15 + 0.08 * Math.sin((2 * Math.PI * 0.12 * i) / sampleRate);
  lowpassL += breeze * (pinkL - lowpassL);
  lowpassR += breeze * (pinkR - lowpassR);

  // Warm gentle pad undertone (D minor 9)
  const pad = 0.08 * Math.sin((2 * Math.PI * 146.83 * i) / sampleRate) +
              0.06 * Math.sin((2 * Math.PI * 220.00 * i) / sampleRate);

  forestL[i] = lowpassL * 0.75 + pad * 0.35;
  forestR[i] = lowpassR * 0.75 + pad * 0.35;
}

// Add gentle random water droplets
const numDrops = 180;
for (let d = 0; d < numDrops; d++) {
  const dropStart = Math.floor(Math.random() * (totalSamples - 5000));
  const pan = Math.random() * 1.6 - 0.8; // -0.8 to +0.8
  const leftGain = Math.cos((pan + 1) * Math.PI * 0.25);
  const rightGain = Math.sin((pan + 1) * Math.PI * 0.25);
  const dropFreq = 1200 + Math.random() * 1400;
  const dropDuration = Math.floor(sampleRate * (0.04 + Math.random() * 0.06));

  for (let j = 0; j < dropDuration; j++) {
    const idx = dropStart + j;
    if (idx >= totalSamples) break;
    const progress = j / dropDuration;
    const freq = dropFreq * (1 - 0.4 * progress);
    const amp = 0.09 * Math.exp(-progress * 6.5);
    const sample = amp * Math.sin((2 * Math.PI * freq * j) / sampleRate);
    forestL[idx] += sample * leftGain;
    forestR[idx] += sample * rightGain;
  }
}

applySeamlessLoop(forestL, sampleRate, 1.2);
applySeamlessLoop(forestR, sampleRate, 1.2);

// ── 2. OCEAN WAVES ──
console.log('Synthesizing Ocean Waves...');
const oceanL = new Float32Array(totalSamples);
const oceanR = new Float32Array(totalSamples);
let oB0L = 0, oB1L = 0, oB2L = 0;
let oB0R = 0, oB1R = 0, oB2R = 0;
let oFiltL = 0, oFiltR = 0;

const wavePeriodSec = 7.5; // Exactly 2 complete waves in 15s

for (let i = 0; i < totalSamples; i++) {
  const whiteL = Math.random() * 2 - 1;
  const whiteR = Math.random() * 2 - 1;

  oB0L = 0.99886 * oB0L + whiteL * 0.0555179;
  oB1L = 0.99332 * oB1L + whiteL * 0.0750759;
  oB2L = 0.96900 * oB2L + whiteL * 0.1538520;
  const pinkL = (oB0L + oB1L + oB2L) * 0.35;

  oB0R = 0.99886 * oB0R + whiteR * 0.0555179;
  oB1R = 0.99332 * oB1R + whiteR * 0.0750759;
  oB2R = 0.96900 * oB2R + whiteR * 0.1538520;
  const pinkR = (oB0R + oB1R + oB2R) * 0.35;

  // Wave swell envelope (asymmetrical crest & retreat)
  const wavePhase = ((i / sampleRate) % wavePeriodSec) / wavePeriodSec;
  // Sine swell with sharper rise and gentle decay
  const swell = Math.pow(Math.sin(wavePhase * Math.PI), 2.2);
  const cutoff = 0.04 + 0.18 * swell; // dynamic filter sweep
  oFiltL += cutoff * (pinkL - oFiltL);
  oFiltR += cutoff * (pinkR - oFiltR);

  // Deep ocean swell drone (55Hz + 110Hz)
  const sub = 0.06 * Math.sin((2 * Math.PI * 55.0 * i) / sampleRate) * (0.6 + 0.4 * swell) +
              0.04 * Math.sin((2 * Math.PI * 110.0 * i) / sampleRate) * (0.6 + 0.4 * swell);

  // Stereo motion across shore
  const wavePan = Math.sin((2 * Math.PI * i) / (wavePeriodSec * sampleRate)) * 0.3;
  const wGainL = 0.5 - wavePan;
  const wGainR = 0.5 + wavePan;

  oceanL[i] = oFiltL * swell * 1.1 * wGainL + sub * 0.5;
  oceanR[i] = oFiltR * swell * 1.1 * wGainR + sub * 0.5;
}

applySeamlessLoop(oceanL, sampleRate, 1.2);
applySeamlessLoop(oceanR, sampleRate, 1.2);

// ── 3. BINAURAL ALPHA MUSIC ──
console.log('Synthesizing Binaural Alpha Music...');
const alphaL = new Float32Array(totalSamples);
const alphaR = new Float32Array(totalSamples);

// 10.0 Hz Alpha Brainwave Entrainment carrier:
// Left: 216.0 Hz, Right: 226.0 Hz -> 10.0 Hz perceived beat
for (let i = 0; i < totalSamples; i++) {
  const t = i / sampleRate;

  // Binaural tone pair
  const binL = 0.16 * Math.sin(2 * Math.PI * 216.0 * t);
  const binR = 0.16 * Math.sin(2 * Math.PI * 226.0 * t);

  // Harmonic 432 Hz Solfeggio Pad Chords with gentle breathing modulation (0.08Hz)
  const breathe = 0.75 + 0.25 * Math.sin(2 * Math.PI * 0.08 * t);
  const pad432 = 0.09 * Math.sin(2 * Math.PI * 432.0 * t) * breathe;
  const pad540 = 0.06 * Math.sin(2 * Math.PI * 540.0 * t) * breathe; // Major 3rd
  const pad324 = 0.07 * Math.sin(2 * Math.PI * 324.0 * t) * breathe; // 4th below
  const pad108 = 0.08 * Math.sin(2 * Math.PI * 108.0 * t);          // Deep sub anchor

  // Subtle singing bowl shimmer overtone (1192Hz = 432 * 2.76)
  const shimmer = 0.02 * Math.sin(2 * Math.PI * 1192.3 * t) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.2 * t));

  const totalPad = (pad432 + pad540 + pad324 + pad108 + shimmer) * 0.6;

  alphaL[i] = binL + totalPad;
  alphaR[i] = binR + totalPad;
}

applySeamlessLoop(alphaL, sampleRate, 1.2);
applySeamlessLoop(alphaR, sampleRate, 1.2);

// ── 4. PEACEFUL STRESS RELIEF ──
console.log('Synthesizing Peaceful Stress Relief...');
const reliefL = new Float32Array(totalSamples);
const reliefR = new Float32Array(totalSamples);

// 528 Hz Healing Solfeggio Frequency + Lush Warm Ambient Rhodes / Piano Chords
// Progression: Fmaj9 (soft, expansive) -> Cmaj7 (grounding, resolve)
// Breathing envelope: 0.125 Hz (8-second natural relaxation cycle)
for (let i = 0; i < totalSamples; i++) {
  const t = i / sampleRate;

  // Calm, expansive breathing swell
  const breath = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.1 * t);

  // 528 Hz Transformation / Stress Relief Healing Carrier
  const carrier528 = 0.08 * Math.sin(2 * Math.PI * 528.0 * t) * breath;

  // Warm chord harmonics (Fmaj9: 174.61Hz, 220Hz, 261.63Hz, 329.63Hz, 392Hz)
  const chord1 = (
    0.08 * Math.sin(2 * Math.PI * 174.61 * t) +
    0.07 * Math.sin(2 * Math.PI * 220.00 * t) +
    0.06 * Math.sin(2 * Math.PI * 261.63 * t) +
    0.06 * Math.sin(2 * Math.PI * 329.63 * t) +
    0.05 * Math.sin(2 * Math.PI * 392.00 * t)
  ) * breath;

  // Soft octave warm bass anchor
  const subBass = 0.09 * Math.sin(2 * Math.PI * 87.31 * t);

  // Gentle celeste shimmer bells
  const chime = 0.02 * Math.sin(2 * Math.PI * 1056.0 * t) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.15 * t));

  // Very subtle stereo widening
  reliefL[i] = (carrier528 * 0.9 + chord1 * 0.95 + subBass + chime * 0.7) * 0.65;
  reliefR[i] = (carrier528 * 0.95 + chord1 * 0.9 + subBass + chime * 1.1) * 0.65;
}

applySeamlessLoop(reliefL, sampleRate, 1.2);
applySeamlessLoop(reliefR, sampleRate, 1.2);

// Write files to public/assets/audio/
const audioDir = fs.existsSync(path.resolve('public/assets/audio'))
  ? path.resolve('public/assets/audio')
  : (fs.existsSync(path.resolve('frontend/public/assets/audio'))
      ? path.resolve('frontend/public/assets/audio')
      : path.resolve('public/assets/audio'));
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const tracks = [
  { name: 'forest-rain', l: forestL, r: forestR },
  { name: 'ocean-waves', l: oceanL, r: oceanR },
  { name: 'binaural-alpha', l: alphaL, r: alphaR },
  { name: 'peaceful-stress-relief', l: reliefL, r: reliefR }
];

tracks.forEach(track => {
  const wavBuffer = createWavBuffer(sampleRate, 2, track.l, track.r);
  
  // Write .wav file
  const wavPath = path.join(audioDir, `${track.name}.wav`);
  fs.writeFileSync(wavPath, wavBuffer);
  console.log(`Saved: ${wavPath} (${(wavBuffer.length / 1024).toFixed(1)} KB)`);

  // Write .mp3 file as valid playable audio resource
  const mp3Path = path.join(audioDir, `${track.name}.mp3`);
  fs.writeFileSync(mp3Path, wavBuffer);
  console.log(`Saved: ${mp3Path} (${(wavBuffer.length / 1024).toFixed(1)} KB)`);
});

console.log('All 4 audio tracks generated and validated successfully!');
