# Story 8.1: Mobile Touch Interaction Adaptation

Status: done

## Summary
Implemented canvas click and contextmenu event handlers for mobile touch interaction. Left click/tap reveals cells, right click/long press toggles flags. Touch events are properly mapped to canvas coordinates and translated to board cell positions across all topology types.

## Files
- src/input/input-handler.ts (updated)
- src/app.ts (updated)
