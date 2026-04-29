import type { CellId } from '../../core/types/index.js';
import type { ITopologyRenderer } from '../../core/topology/types.js';
import { BoardModel } from '../logic/board-model.js';
import type { CellInfo } from '../logic/board-model.js';

const HEX_SIZE = 30;

const COLORS: Record<string, string> = {
  bg: '#0f0f23',
  unrevealed: '#2a2a5a',
  unrevealedStroke: '#4a4a7a',
  revealed: '#1a2a3a',
  revealedStroke: '#3a5a7a',
  flagged: '#4a3a1a',
  flaggedStroke: '#8a7a3a',
  mineHit: '#e94560',
  mineRevealed: '#8a2a3a',
  hover: '#3a3a6a',
  hoverStroke: '#6a6a9a',
  text0: '#555',
  text1: '#4a9eff',
  text2: '#4aff4a',
  text3: '#ff4a4a',
  text4: '#9a4aff',
  textHigh: '#ff9a4a',
  fuzzy: '#ffa500',
  delayed: '#9b59b6',
};

function numberColor(n: number): string {
  if (n === 0) return COLORS.text0;
  if (n === 1) return COLORS.text1;
  if (n === 2) return COLORS.text2;
  if (n === 3) return COLORS.text3;
  if (n === 4) return COLORS.text4;
  return COLORS.textHigh;
}

/**
 * Canvas-based game renderer.
 */
export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private board: BoardModel | null = null;
  private topology: ITopologyRenderer | null = null;
  private offsetX = 0;
  private offsetY = 0;
  private scale = 1;
  private hoveredCell: CellId | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  setBoard(board: BoardModel): void {
    this.board = board;
    this.topology = board.getTopology() as ITopologyRenderer;
    // Resize canvas to match container
    const container = this.canvas.parentElement;
    if (container) {
      this.canvas.width = container.clientWidth;
      this.canvas.height = container.clientHeight;
    }
    this.computeOffset();
    this.render();
  }

  setHoveredCell(cellId: CellId | null): void {
    if (this.hoveredCell !== cellId) {
      this.hoveredCell = cellId;
      this.render();
    }
  }

  cellAtPoint(canvasX: number, canvasY: number): CellId | null {
    if (!this.topology) return null;
    // Reverse the scale + offset transform
    const x = (canvasX - this.offsetX) / this.scale;
    const y = (canvasY - this.offsetY) / this.scale;
    return this.topology.cellAt(x, y);
  }

  render(): void {
    if (!this.board || !this.topology) return;
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const infos = this.board.getAllCellInfos();
    const hoverNeighbors = new Set<CellId>();
    if (this.hoveredCell !== null) {
      hoverNeighbors.add(this.hoveredCell);
      for (const n of this.topology.neighbors(this.hoveredCell)) {
        hoverNeighbors.add(n);
      }
    }

    for (const info of infos) {
      const center = this.topology.cellCenter(info.cellId);
      const x = center.x * this.scale + this.offsetX;
      const y = center.y * this.scale + this.offsetY;
      const isHovered = hoverNeighbors.has(info.cellId);
      this.drawCell(x, y, info, isHovered);
    }
  }

  private drawCell(x: number, y: number, info: CellInfo, isHovered: boolean): void {
    const { ctx } = this;
    let fill: string;
    let stroke: string;

    switch (info.visualState) {
      case 'revealed':
        fill = info.mechanismDisplay ? '#2a2a1a' : COLORS.revealed; // fuzzy = amber tint
        stroke = info.mechanismDisplay ? '#5a5a3a' : COLORS.revealedStroke;
        break;
      case 'flagged':
        fill = COLORS.flagged;
        stroke = COLORS.flaggedStroke;
        break;
      case 'pencil-mine':
        fill = '#4a3a0a';
        stroke = '#8a7a2a';
        break;
      case 'pencil-safe':
        fill = '#0a2a4a';
        stroke = '#2a5a8a';
        break;
      case 'mine-hit':
        fill = COLORS.mineHit;
        stroke = '#ff6b81';
        break;
      case 'mine-revealed':
        fill = COLORS.mineRevealed;
        stroke = '#aa4a5a';
        break;
      default: // unrevealed
        fill = isHovered ? COLORS.hover : COLORS.unrevealed;
        stroke = isHovered ? COLORS.hoverStroke : COLORS.unrevealedStroke;
    }

    // Draw cell shape
    const shape = this.topology!.cellShape(info.cellId);
    const s = this.scale;
    const TRI_S = 14 * s;
    ctx.beginPath();
    if (shape === 'triangle') {
      const cols = (this.board!.level.topologyConfig.cols) || 1;
      const row = Math.floor(info.cellId / cols);
      const col = info.cellId % cols;
      const isUpward = (row + col) % 2 === 0;
      if (isUpward) {
        ctx.moveTo(x, y - TRI_S);
        ctx.lineTo(x - TRI_S, y + TRI_S * 0.7);
        ctx.lineTo(x + TRI_S, y + TRI_S * 0.7);
      } else {
        ctx.moveTo(x, y + TRI_S);
        ctx.lineTo(x - TRI_S, y - TRI_S * 0.7);
        ctx.lineTo(x + TRI_S, y - TRI_S * 0.7);
      }
    } else if (shape === 'rectangle') {
      const RECT_SIZE = 17 * s;
      ctx.rect(x - RECT_SIZE, y - RECT_SIZE, RECT_SIZE * 2, RECT_SIZE * 2);
    } else if (shape === 'polygon') {
      // Irregular/mixed: draw as circle
      const radius = 18 * s;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
    } else {
      // hexagon
      const hs = HEX_SIZE * s;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = x + hs * Math.cos(angle);
        const py = y + hs * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5 * s;
    ctx.stroke();

    // Draw content
    const fontSize = Math.max(10, Math.round(13 * s));
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (info.visualState === 'flagged') {
      ctx.fillStyle = '#ffd700';
      ctx.font = `${Math.round(16 * s)}px sans-serif`;
      ctx.fillText('🚩', x, y);
    } else if (info.visualState === 'pencil-mine') {
      ctx.fillStyle = '#ffd700';
      ctx.font = `${Math.round(14 * s)}px sans-serif`;
      ctx.fillText('❓', x, y);
    } else if (info.visualState === 'pencil-safe') {
      ctx.fillStyle = '#4a9eff';
      ctx.font = `${Math.round(14 * s)}px sans-serif`;
      ctx.fillText('●', x, y);
    } else if (info.visualState === 'mine-hit' || info.visualState === 'mine-revealed') {
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.round(16 * s)}px sans-serif`;
      ctx.fillText('💣', x, y);
    } else if (info.visualState === 'revealed') {
      if (info.mechanismDisplay) {
        ctx.fillStyle = COLORS.fuzzy;
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.fillText(info.mechanismDisplay, x, y - 3 * s);
        ctx.fillStyle = '#886600';
        ctx.font = `${Math.max(8, Math.round(9 * s))}px monospace`;
        ctx.fillText('≈ 模糊', x, y + 12 * s);
      } else if (info.mineNeighborCount > 0) {
        ctx.fillStyle = numberColor(info.mineNeighborCount);
        ctx.font = `bold ${Math.round(14 * s)}px monospace`;
        ctx.fillText(String(info.mineNeighborCount), x, y);
      }
    }
  }

  private computeOffset(): void {
    if (!this.board || !this.topology) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const cellId of this.board.level.cells) {
      const c = this.topology.cellCenter(cellId);
      minX = Math.min(minX, c.x); minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x); maxY = Math.max(maxY, c.y);
    }

    const padding = HEX_SIZE * 2;
    const boardW = maxX - minX + padding;
    const boardH = maxY - minY + padding;

    // Scale to fit canvas with margin
    const margin = 20;
    const availW = this.canvas.width - margin * 2;
    const availH = this.canvas.height - margin * 2;
    this.scale = Math.min(1.2, availW / boardW, availH / boardH);

    // Center the scaled board
    const scaledW = boardW * this.scale;
    const scaledH = boardH * this.scale;
    this.offsetX = (this.canvas.width - scaledW) / 2 - minX * this.scale + padding / 2 * this.scale;
    this.offsetY = (this.canvas.height - scaledH) / 2 - minY * this.scale + padding / 2 * this.scale;
  }
}
