# Story 7.1: Pause System and Auto-Pause

Status: done

## Summary
Added pause/resume states to GameStateMachine with proper state transitions. LevelManager exposes pauseGame() and resumeGame() methods. Auto-pause implemented via visibilitychange event listener in app.ts, automatically pausing the game when the browser tab loses focus and resuming when it regains focus.

## Files
- src/state/game-state-machine.ts (updated)
- src/levels/level-manager.ts (updated)
- src/app.ts (updated)
