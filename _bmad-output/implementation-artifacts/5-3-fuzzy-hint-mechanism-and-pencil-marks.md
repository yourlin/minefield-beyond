# Story 5.3: Fuzzy Hint Mechanism and Pencil Marks

Status: done

## Summary
Added pencil mark support to BoardModel with two mark types: pencil-mine (❓) for suspected mines and pencil-safe (●) for suspected safe cells. Extended CellVisualState to include pencil mark rendering states. BFS auto-expand logic updated to propagate through pencil-marked cells correctly, treating them as soft annotations rather than hard commitments.

## Files
- src/models/board-model.ts (updated)
