import type { LevelData } from '../../core/types/level.js';
import { CanvasRenderer } from './renderer/canvas-renderer.js';
import { setupFileLoader } from './ui/file-loader.js';
import { updateInfoPanel, updateCellInfo } from './ui/info-panel.js';
import { setupSimControls, enableControls } from './ui/simulation-controls.js';

// Ensure topology registry is populated
import '../../core/topology/topology-registry.js';

/**
 * Initialize the level reader application.
 */
export function initApp(): void {
  const canvas = document.getElementById('board-canvas') as HTMLCanvasElement;
  const errorBar = document.getElementById('error-bar')!;
  const renderer = new CanvasRenderer(canvas);

  let currentLevel: LevelData | null = null;

  // File loader
  setupFileLoader(
    (level, fileName) => {
      currentLevel = level;
      renderer.loadLevel(level);
      updateInfoPanel(level);
      enableControls();
      hideError();
      document.getElementById('file-name')!.textContent = fileName;
    },
    (message) => {
      showError(message);
    },
  );

  // Simulation controls
  setupSimControls({
    onRevealAll: () => renderer.revealAll(),
    onReset: () => renderer.reset(),
    onToggleMines: (show) => renderer.setShowMines(show),
  });

  // Canvas click handler
  canvas.addEventListener('click', (e) => {
    if (!currentLevel) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cellId = renderer.cellAtPoint(x, y);
    if (cellId !== null) {
      // Highlight cell and neighbors
      renderer.highlightCell(cellId);

      // Show cell info
      const info = renderer.getCellInfo(cellId);
      updateCellInfo(info);

      // Reveal on click
      renderer.revealCell(cellId);
    } else {
      renderer.clearHighlight();
    }
  });

  function showError(message: string): void {
    errorBar.textContent = message;
    errorBar.classList.remove('hidden');
  }

  function hideError(): void {
    errorBar.classList.add('hidden');
  }
}
