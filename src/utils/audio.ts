/**
 * Audio notification using Web Audio API.
 * Generates tones programmatically — no external audio files needed.
 */

let audioContext: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  // Resume if suspended (browsers require user gesture)
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }
  return audioContext;
}

/**
 * Play a pleasant notification chime.
 * - 3 ascending tones at ~0.5s intervals
 * - Each tone is a sine wave with gentle envelope
 */
export function playNotification(volume = 0.5): void {
  try {
    const ctx = getContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.value = Math.min(1, Math.max(0, volume));

    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    const noteDuration = 0.15;
    const gap = 0.2;

    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = freq;

      const noteGain = ctx.createGain();
      oscillator.connect(noteGain);
      noteGain.connect(gain);

      const startTime = ctx.currentTime + i * gap;
      const endTime = startTime + noteDuration;

      // Gentle attack / release envelope
      noteGain.gain.setValueAtTime(0, startTime);
      noteGain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
      noteGain.gain.setValueAtTime(volume, endTime - 0.03);
      noteGain.gain.linearRampToValueAtTime(0, endTime);

      oscillator.start(startTime);
      oscillator.stop(endTime);
    });
  } catch (err) {
    // Web Audio API not available — silently degrade
    console.warn("Audio notification unavailable:", err);
  }
}

/**
 * Play a softer "break over" chime (2 descending tones).
 */
export function playBreakOver(volume = 0.5): void {
  try {
    const ctx = getContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.value = Math.min(1, Math.max(0, volume));

    const frequencies = [587.33, 440]; // D5, A4
    const gap = 0.25;

    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      oscillator.type = "triangle";
      oscillator.frequency.value = freq;

      const noteGain = ctx.createGain();
      oscillator.connect(noteGain);
      noteGain.connect(gain);

      const startTime = ctx.currentTime + i * gap;
      const endTime = startTime + 0.2;

      noteGain.gain.setValueAtTime(0, startTime);
      noteGain.gain.linearRampToValueAtTime(volume * 0.7, startTime + 0.02);
      noteGain.gain.linearRampToValueAtTime(0, endTime);

      oscillator.start(startTime);
      oscillator.stop(endTime);
    });
  } catch {
    console.warn("Audio notification unavailable");
  }
}

/** Cleanup the audio context */
export function closeAudio(): void {
  if (audioContext) {
    void audioContext.close();
    audioContext = null;
  }
}
