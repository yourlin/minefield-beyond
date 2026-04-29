import type { LevelData } from '../../../core/types/level.js';
import type { ITopologyRenderer } from '../../../core/topology/types.js';
import type { CellId } from '../../../core/types/index.js';
import { TopologyRegistry } from '../../../core/topology/topology-registry.js';
import { MechanismType } from '../../../core/mechanism/types.js';

// Ensure topology registry is populated
import '../../../core/topology/topology-registry.js';

/** Hex circumradius matching HexTopology's DEFAULT_HEX_SIZE. */
const HEX_SIZE = 30;

/** Colors for cell states. */
const COLORS = {
  unrevealed: '#2a2a4a',
  unrevealedStroke: '#4a4a6a',
  revealed: '#1a3a5a',
  revealedStroke: '#3a6a8a',
  mine: '#e94560',
  mineStroke: '#ff6b81',
  highlight: '#ffd700',
  highlightStroke: '#ffed4a',
  text: '#e0e0e0',
  mineText: '#ffffff',
  fuzzyText: '#ffa500',
  delayedText: '#9b59b6',
};

/** Cell visual state. */
export type CellVisualState = 'unrevealed' | 'revealed' | 'mine' | 'highlighted';

/**
 * Canvas-based board renderer for the level reader.
 */
export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private topology: ITopologyRenderer | null = null;
  private level: LevelData | null = null;
  private cellStates: Map<CellId, CellVisualState> = new Map();
  private highlightedCells: Set<CellId> = new Set();
  private showMines = false;
  private offsetX = 0;
  private offsetY = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  /**
   * Load a level and prepare for rendering.
   */
  loadLevel(level: LevelData): void {
    this.level = level;
    this.topology = TopologyRegistry.create(
      level.topologyType,
      level.topologyConfig,
    ) as ITopologyRenderer;

    // Reset states
    this.cellStates.clear();
    this.highlightedCells.clear();
    for (const cellId of level.cells) {
      this.cellStates.set(cellId, 'unrevealed');
    }

    // Compute offset to center the board
    this.computeOffset();
    this.render();
  }

  /**
   * Reveal a cell, showing its mine count or mine status.
   */
  revealCell(cellId: CellId): void {
    if (!this.level) return;
    const mineSet = new Set(this.level.minePositions);
    if (mineSet.has(cellId)) {
      this.cellStates.set(cellId, 'mine');
    } else {
      this.cellStates.set(cellId, 'revealed');
    }
    this.render();
  }

  /**
   * Reveal all cells.
   */
  revealAll(): void {
    if (!this.level) return;
    const mineSet = new Set(this.level.minePositions);
    for (const cellId of this.level.cells) {
      this.cellStates.set(cellId, mineSet.has(cellId) ? 'mine' : 'revealed');
    }
    this.render();
  }

  /**
   * Reset all cells to unrevealed.
   */
  reset(): void {
    if (!this.level) return;
    for (const cellId of this.level.cells) {
      this.cellStates.set(cellId, 'unrevealed');
    }
    this.highlightedCells.clear();
    this.render();
  }

  /**
   * Toggle mine visibility.
   */
  setShowMines(show: boolean): void {
    this.showMines = show;
    this.render();
  }

  /**
   * Highlight a cell and its neighbors.
   */
  highlightCell(cellId: CellId): void {
    if (!this.topology) return;
    this.highlightedCells.clear();
    this.highlightedCells.add(cellId);
    for (const n of this.topology.neighbors(cellId)) {
      this.highlightedCells.add(n);
    }
    this.render();
  }

  /**
   * Clear highlights.
   */
  clearHighlight(): void {
    this.highlightedCells.clear();
    this.render();
  }

  /**
   * Hit-test: find which cell is at the given canvas coordinates.
   */
  cellAtPoint(canvasX: number, canvasY: number): CellId | null {
    if (!this.topology) return null;
    return this.topology.cellAt(canvasX - this.offsetX, canvasY - this.offsetY);
  }

  /**
   * Get info about a cell for the info panel.
   */
  getCellInfo(cellId: CellId): string {
    if (!this.level || !this.topology) return '';
    const mineSet = new Set(this.level.minePositions);
    const isMine = mineSet.has(cellId);
    const neighbors = this.topology.neighbors(cellId);
    const mineNeighborCount = neighbors.filter((n) => mineSet.has(n)).length;
    const center = this.topology.cellCenter(cellId);

    const mechEntry = this.level.mechanismConfigs.find((m) => m.cellId === cellId);
    let mechInfo = '无';
    if (mechEntry) {
      if (mechEntry.config.type === MechanismType.FuzzyHint) {
        mechInfo = `模糊提示 (offset: ${mechEntry.config.offset})`;
      } else if (mechEntry.config.type === MechanismType.DelayedReveal) {
        mechInfo = `延迟揭示 (delay: ${mechEntry.config.delay})`;
      }
    }

    return [
      `Cell ID: ${cellId}`,
      `位置: (${center.x.toFixed(1)}, ${center.y.toFixed(1)})`,
      `是否地雷: ${isMine ? '是 💣' : '否'}`,
      `邻居地雷数: ${mineNeighborCount}`,
      `邻居数: ${neighbors.length}`,
      `信息机制: ${mechInfo}`,
    ].join('\n');
  }

  /**
   * Render the board.
   */
  private render(): void {
    if (!this.level || !this.topology) return;

    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const mineSet = new Set(this.level.minePositions);

    for (const cellId of this.level.cells) {
      const center = this.topology.cellCenter(cellId);
      const x = center.x + this.offsetX;
      const y = center.y + this.offsetY;

      const state = this.cellStates.get(cellId) ?? 'unrevealed';
      const isHighlighted = this.highlightedCells.has(cellId);
      const isMine = mineSet.has(cellId);

      // Determine colors
      let fill: string;
      let stroke: string;

      if (isHighlighted) {
        fill = COLORS.highlight;
        stroke = COLORS.highlightStroke;
      } else if (state === 'mine' || (this.showMines && isMine)) {
        fill = COLORS.mine;
        stroke = COLORS.mineStroke;
      } else if (state === 'revealed') {
        fill = COLORS.revealed;
        stroke = COLORS.revealedStroke;
      } else {
        fill = COLORS.unrevealed;
        stroke = COLORS.unrevealedStroke;
      }

      // Draw hexagon
      this.drawHexagon(x, y, HEX_SIZE, fill, stroke);

      // Draw text
      if (state === 'revealed' || (state === 'mine' && !isMine)) {
        const neighbors = this.topology.neighbors(cellId);
        const mineNeighborCount = neighbors.filter((n) => mineSet.has(n)).length;

        const mechEntry = this.level.mechanismConfigs.find((m) => m.cellId === cellId);
        if (mechEntry?.config.type === MechanismType.FuzzyHint) {
          const offset = mechEntry.config.offset;
          const min = Math.max(0, mineNeighborCount - offset);
          const max = mineNeighborCount + offset;
          this.drawText(x, y, `${min}-${max}`, COLORS.fuzzyText);
        } else if (mechEntry?.config.type === MechanismType.DelayedReveal) {
          this.drawText(x, y, `⏳${mineNeighborCount}`, COLORS.delayedText);
        } else if (mineNeighborCount > 0) {
          this.drawText(x, y, String(mineNeighborCount), COLORS.text);
        }
      } else if (state === 'mine' || (this.showMines && isMine)) {
        this.drawText(x, y, '💣', COLORS.mineText);
      }
    }
  }

  /**
   * Draw a pointy-top hexagon.
   */
  private drawHexagon(
    cx: number,
    cy: number,
    size: number,
    fill: string,
    stroke: string,
  ): void {
    const { ctx } = this;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = cx + size * Math.cos(angle);
      const py = cy + size * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  /**
   * Draw centered text.
   */
  private drawText(cx: number, cy: number, text: string, color: string): void {
    const { ctx } = this;
    ctx.fillStyle = color;
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy);
  }

  /**
   * Compute offset to center the board in the canvas.
   */
  private computeOffset(): void {
    if (!this.level || !this.topology) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const cellId of this.level.cells) {
      const center = this.topology.cellCenter(cellId);
      minX = Math.min(minX, center.x);
      minY = Math.min(minY, center.y);
      maxX = Math.max(maxX, center.x);
      maxY = Math.max(maxY, center.y);
    }

    const boardWidth = maxX - minX + HEX_SIZE * 2;
    const boardHeight = maxY - minY + HEX_SIZE * 2;

    this.offsetX = (this.canvas.width - boardWidth) / 2 - minX + HEX_SIZE;
    this.offsetY = (this.canvas.height - boardHeight) / 2 - minY + HEX_SIZE;
  }
}
