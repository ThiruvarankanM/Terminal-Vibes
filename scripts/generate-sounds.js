/**
 * Generates small, distinct WAV files for each bundled preset sound.
 * Each sound is synthesized from scratch using raw PCM — no external dependencies.
 * Run: node scripts/generate-sounds.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'media', 'sounds');
if (!fs.existsSync(OUT_DIR)) { fs.mkdirSync(OUT_DIR, { recursive: true }); }

const SAMPLE_RATE = 22050;

// ── WAV writer ──────────────────────────────────────────────────────────────

function writeWav(filePath, samples) {
  const pcm = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    pcm.writeInt16LE(Math.round(clamped * 32767), i * 2);
  }
  const dataLen = pcm.length;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLen, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);        // chunk size
  header.writeUInt16LE(1, 20);         // PCM
  header.writeUInt16LE(1, 22);         // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);         // block align
  header.writeUInt16LE(16, 34);        // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(dataLen, 40);
  fs.writeFileSync(filePath, Buffer.concat([header, pcm]));
  console.log('  wrote', path.basename(filePath));
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function sine(freq, durationSec, amplitude = 0.8) {
  const n = Math.round(SAMPLE_RATE * durationSec);
  return Array.from({ length: n }, (_, i) =>
    amplitude * Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE)
  );
}

function envelope(samples, attackSec = 0.01, releaseSec = 0.05) {
  const attackN  = Math.round(SAMPLE_RATE * attackSec);
  const releaseN = Math.round(SAMPLE_RATE * releaseSec);
  return samples.map((s, i) => {
    if (i < attackN)                          { return s * (i / attackN); }
    if (i > samples.length - releaseN)        { return s * ((samples.length - i) / releaseN); }
    return s;
  });
}

function concat(...arrays) {
  return [].concat(...arrays);
}

function silence(durationSec) {
  return new Array(Math.round(SAMPLE_RATE * durationSec)).fill(0);
}

// ── Sounds ──────────────────────────────────────────────────────────────────

// 1. error-classic: descending "faah" — two down-swept tones
function makeErrorClassic() {
  const part1 = envelope(sine(800, 0.15, 0.9), 0.01, 0.05);
  const part2 = envelope(sine(400, 0.20, 0.8), 0.01, 0.08);
  return concat(part1, silence(0.03), part2);
}

// 2. fail-trombone: three descending notes
function makeFailTrombone() {
  const notes = [
    envelope(sine(392, 0.18, 0.85), 0.01, 0.06),
    envelope(sine(330, 0.18, 0.80), 0.01, 0.06),
    envelope(sine(262, 0.28, 0.90), 0.01, 0.12),
  ];
  return concat(notes[0], silence(0.04), notes[1], silence(0.04), notes[2]);
}

// 3. windows-error: classic two-tone alert
function makeWindowsError() {
  const beep = (freq) => envelope(sine(freq, 0.12, 0.75), 0.005, 0.03);
  return concat(beep(800), silence(0.05), beep(640));
}

// 4. buzz-alert: rapid buzz/pulse
function makeBuzzAlert() {
  const n = Math.round(SAMPLE_RATE * 0.4);
  const pulseRate = 30; // Hz
  return Array.from({ length: n }, (_, i) => {
    const t = i / SAMPLE_RATE;
    const base = Math.sin(2 * Math.PI * 220 * t);
    const pulse = Math.sign(Math.sin(2 * Math.PI * pulseRate * t));
    // envelope
    const env = i < 800 ? i / 800 : i > n - 800 ? (n - i) / 800 : 1;
    return base * pulse * 0.75 * env;
  });
}

// ── Write ────────────────────────────────────────────────────────────────────

const sounds = {
  'error-classic.wav':  makeErrorClassic,
  'fail-trombone.wav':  makeFailTrombone,
  'windows-error.wav':  makeWindowsError,
  'buzz-alert.wav':     makeBuzzAlert,
};

console.log('Generating bundled sounds...');
for (const [name, fn] of Object.entries(sounds)) {
  writeWav(path.join(OUT_DIR, name), fn());
}
console.log('Done.');
