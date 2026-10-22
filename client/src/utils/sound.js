/**
 * Plays an airport / station style chime using Web Audio API
 */
export const playCallChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const notes = [
      { freq: 587.33, time: 0.0, duration: 0.4 }, // D5
      { freq: 880.00, time: 0.25, duration: 0.6 }, // A5
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      gain.gain.setValueAtTime(0, now + note.time);
      gain.gain.linearRampToValueAtTime(0.25, now + note.time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration);
    });
  } catch (e) {
    console.warn('Audio chime playback was blocked or unsupported:', e);
  }
};
