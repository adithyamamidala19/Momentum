import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MeditativeAudio, AUDIO_SOURCES } from '../js/services/soundscape.js';

test('🌿 Soundscape & Audio Tracks Test Suite', async (t) => {
  await t.test('1. Audio Assets Integrity on Disk', () => {
    const requiredFiles = [
      'forest-rain.wav',
      'forest-rain.mp3',
      'ocean-waves.wav',
      'ocean-waves.mp3',
      'binaural-alpha.wav',
      'binaural-alpha.mp3',
      'peaceful-stress-relief.wav',
      'peaceful-stress-relief.mp3'
    ];

    const audioDir = path.resolve('public/assets/audio');
    assert.ok(fs.existsSync(audioDir), 'public/assets/audio directory must exist');

    requiredFiles.forEach((file) => {
      const fullPath = path.join(audioDir, file);
      assert.ok(fs.existsSync(fullPath), `Audio file must exist: ${file}`);
      const stats = fs.statSync(fullPath);
      assert.ok(stats.size > 500000, `Audio file ${file} must be non-empty valid audio (>500KB, got ${stats.size} bytes)`);

      // Verify standard RIFF/WAVE header
      const buffer = fs.readFileSync(fullPath);
      assert.equal(buffer.toString('utf8', 0, 4), 'RIFF', `${file} must have valid RIFF magic bytes`);
      assert.equal(buffer.toString('utf8', 8, 12), 'WAVE', `${file} must have valid WAVE magic bytes`);
    });
  });

  await t.test('2. AUDIO_SOURCES Mapping & Presets', () => {
    const expectedPresets = ['forest', 'ocean', 'alpha', 'relief'];

    expectedPresets.forEach((preset) => {
      assert.ok(AUDIO_SOURCES[preset], `AUDIO_SOURCES must have key for preset: ${preset}`);
      assert.ok(Array.isArray(AUDIO_SOURCES[preset]), `${preset} sources must be an array`);
      assert.ok(AUDIO_SOURCES[preset].length >= 2, `${preset} sources must contain both primary and fallback files`);

      // Verify source URLs map to existing files in public/
      AUDIO_SOURCES[preset].forEach((url) => {
        const localPath = path.join('public', url);
        assert.ok(fs.existsSync(localPath), `Source URL ${url} must resolve to physical file at ${localPath}`);
      });
    });

    // Check Peaceful Stress Relief aliases
    assert.ok(AUDIO_SOURCES['peaceful'], 'Must support peaceful alias');
    assert.ok(AUDIO_SOURCES['stress-relief'], 'Must support stress-relief alias');
  });

  await t.test('3. MeditativeAudio Interface & State Methods', () => {
    assert.equal(typeof MeditativeAudio.ensureContext, 'function');
    assert.equal(typeof MeditativeAudio.startTone, 'function');
    assert.equal(typeof MeditativeAudio.stopTone, 'function');
    assert.equal(typeof MeditativeAudio.setPreset, 'function');
    assert.equal(typeof MeditativeAudio.setVolume, 'function');
    assert.equal(typeof MeditativeAudio.playChime, 'function');
    assert.equal(typeof MeditativeAudio.playSingingBowlChime, 'function');

    // Volume clamping
    MeditativeAudio.setVolume(0.75);
    assert.equal(MeditativeAudio.currentVolume, 0.75);

    MeditativeAudio.setVolume(-0.5);
    assert.equal(MeditativeAudio.currentVolume, 0.0);

    MeditativeAudio.setVolume(1.5);
    assert.equal(MeditativeAudio.currentVolume, 1.0);

    MeditativeAudio.setVolume(0.4);
    assert.equal(MeditativeAudio.currentVolume, 0.4);

    // Preset switching
    MeditativeAudio.setPreset('ocean');
    assert.equal(MeditativeAudio.currentPreset, 'ocean');

    MeditativeAudio.setPreset('alpha');
    assert.equal(MeditativeAudio.currentPreset, 'alpha');

    MeditativeAudio.setPreset('relief');
    assert.equal(MeditativeAudio.currentPreset, 'relief');

    MeditativeAudio.setPreset('forest');
    assert.equal(MeditativeAudio.currentPreset, 'forest');

    // Safe execution in node without throwing
    assert.doesNotThrow(() => {
      MeditativeAudio.ensureContext();
      MeditativeAudio.startTone('relief');
      MeditativeAudio.stopTone();
      MeditativeAudio.playChime(432);
    });
  });
});
