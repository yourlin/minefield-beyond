/**
 * Audio event types.
 */
export type AudioEvent = 'reveal' | 'flag' | 'mine' | 'win';

/**
 * Minimal audio manager.
 *
 * Uses Web Audio API for sound effects. Falls back gracefully
 * if audio is unavailable.
 */
export class AudioManager {
  private enabled = true;
  private audioCtx: AudioContext | null = null;

  /**
   * Set whether audio is enabled.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if audio is enabled.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Play a sound effect for the given event.
   */
  play(event: AudioEvent): void {
    if (!this.enabled) return;

    try {
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }

      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      switch (event) {
        case 'reveal':
          osc.frequency.value = 600;
          osc.type = 'sine';
          gain.gain.value = 0.1;
          osc.start();
          osc.stop(ctx.currentTime + 0.05);
          break;
        case 'flag':
          osc.frequency.value = 400;
          osc.type = 'triangle';
          gain.gain.value = 0.1;
          osc.start();
          osc.stop(ctx.currentTime + 0.08);
          break;
        case 'mine':
          osc.frequency.value = 150;
          osc.type = 'sawtooth';
          gain.gain.value = 0.15;
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
          break;
        case 'win':
          osc.frequency.value = 800;
          osc.type = 'sine';
          gain.gain.value = 0.1;
          osc.start();
          // Rising tone
          osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.3);
          osc.stop(ctx.currentTime + 0.4);
          break;
      }
    } catch {
      // Audio not available — silently fail
    }
  }
}
