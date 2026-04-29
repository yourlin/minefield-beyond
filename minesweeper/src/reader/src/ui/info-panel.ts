import type { LevelData } from '../../../core/types/level.js';
import { MechanismType } from '../../../core/mechanism/types.js';

/**
 * Update the info panel with level metadata.
 */
export function updateInfoPanel(level: LevelData): void {
  const panel = document.getElementById('level-info')!;

  const mechSummary = level.mechanismConfigs.length > 0
    ? level.mechanismConfigs.map((m) => {
        if (m.config.type === MechanismType.FuzzyHint) {
          return `Cell ${m.cellId}: 模糊提示 (offset=${m.config.offset})`;
        }
        if (m.config.type === MechanismType.DelayedReveal) {
          return `Cell ${m.cellId}: 延迟揭示 (delay=${m.config.delay})`;
        }
        return `Cell ${m.cellId}: 未知机制`;
      }).join('<br>')
    : '无';

  panel.innerHTML = `
    <p><strong>名称:</strong> ${level.metadata.name}</p>
    <p><strong>作者:</strong> ${level.metadata.author}</p>
    <p><strong>难度:</strong> ${level.metadata.difficulty}</p>
    <p><strong>拓扑:</strong> ${level.topologyType}</p>
    <p><strong>格子数:</strong> ${level.cells.length}</p>
    <p><strong>地雷数:</strong> ${level.minePositions.length}</p>
    <p><strong>信息机制:</strong><br>${mechSummary}</p>
  `;
}

/**
 * Update the cell info section.
 */
export function updateCellInfo(info: string): void {
  const panel = document.getElementById('cell-info')!;
  panel.innerHTML = `<pre>${info}</pre>`;
}

/**
 * Clear the info panel.
 */
export function clearInfoPanel(): void {
  const panel = document.getElementById('level-info')!;
  panel.innerHTML = '<p class="placeholder">请加载 .mswp 文件</p>';
}
