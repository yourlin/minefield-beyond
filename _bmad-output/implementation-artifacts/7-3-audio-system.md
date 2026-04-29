# Story 7.3: Audio System

Status: done

## Summary
Implemented AudioManager using the Web Audio API with oscillator-based sound synthesis. Provides distinct audio cues for key game events: cell reveal (short click), flag placement (soft tone), mine hit (low rumble), and win celebration (ascending chime). No external audio files required — all sounds generated programmatically.

## Files
- src/audio/audio-manager.ts
