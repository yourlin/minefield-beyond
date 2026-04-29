import type { LevelData } from '../../core/types/level.js';
import { BinaryLevelCodec } from '../../core/binary/binary-codec.js';
import { LevelManager } from '../logic/level-manager.js';
import { LocalStorageAdapter } from '../logic/storage.js';
import { GameRenderer } from './game-renderer.js';
import type { BoardModel } from '../logic/board-model.js';

import '../../core/topology/topology-registry.js';

interface LevelCategory {
  id: string;
  label: string;
  icon: string;
  files: string[];
  levels: LevelData[];
}

const CATEGORIES: Omit<LevelCategory, 'levels'>[] = [
  {
    id: 'hex', label: '六边形', icon: '⬡',
    files: Array.from({ length: 10 }, (_, i) => `/levels/hex-${String(i + 1).padStart(2, '0')}.mswp`),
  },
  {
    id: 'torus', label: '环面', icon: '🔁',
    files: Array.from({ length: 10 }, (_, i) => `/levels/torus-${String(i + 1).padStart(2, '0')}.mswp`),
  },
  {
    id: 'tri', label: '三角形', icon: '△',
    files: Array.from({ length: 10 }, (_, i) => `/levels/tri-${String(i + 1).padStart(2, '0')}.mswp`),
  },
];

export class GameApp {
  private levelManager: LevelManager;
  private renderer: GameRenderer;
  private canvas: HTMLCanvasElement;
  private categories: LevelCategory[] = [];
  private currentCategory: LevelCategory | null = null;
  private timerInterval: number | null = null;
  private board: BoardModel | null = null;
  private pendingOverlay: (() => void) | null = null;
  private devMode = false;
  private devUnlockCount = Infinity;
  /** Global level index used for progress tracking (category offset + level index). */
  private globalLevelIndex = 0;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.renderer = new GameRenderer(this.canvas);
    // 30 levels total — extend ProgressManager to handle 30
    this.levelManager = new LevelManager(new LocalStorageAdapter());

    const params = new URLSearchParams(window.location.search);
    if (params.has('dev')) {
      this.devMode = true;
      const val = params.get('dev');
      this.devUnlockCount = val && val !== '' && val !== 'true' ? parseInt(val, 10) : Infinity;
      if (isNaN(this.devUnlockCount)) this.devUnlockCount = Infinity;
    }

    this.setupControls();
    this.setupCanvasInput();
    this.setupVisibilityChange();
  }

  async init(): Promise<void> {
    const codec = new BinaryLevelCodec();

    for (const catDef of CATEGORIES) {
      const cat: LevelCategory = { ...catDef, levels: [] };
      for (const fileUrl of catDef.files) {
        try {
          const resp = await fetch(fileUrl);
          if (fileUrl.endsWith('.json')) {
            const data = await resp.json();
            cat.levels.push(data as LevelData);
          } else {
            const buffer = await resp.arrayBuffer();
            cat.levels.push(codec.decode(buffer));
          }
        } catch {
          console.warn(`Failed to load ${fileUrl}`);
        }
      }
      this.categories.push(cat);
    }

    this.showCategorySelect();
  }

  // === Category Selection ===

  private showCategorySelect(): void {
    this.stopTimer();
    this.currentCategory = null;
    this.pendingOverlay = null;
    const select = document.getElementById('level-select')!;
    select.classList.add('active');
    document.getElementById('game-play')!.classList.remove('active');
    document.getElementById('game-overlay')!.classList.add('hidden');
    document.getElementById('controls')!.classList.add('hidden');
    this.updateHud('', '');
    document.getElementById('hud-status')!.textContent = this.devMode ? '🔧 DEV' : '';

    const grid = document.getElementById('level-grid')!;
    grid.innerHTML = '';

    const heading = document.getElementById('level-select-heading')!;
    heading.textContent = '选择拓扑类型';

    // Show category cards
    for (const cat of this.categories) {
      const card = document.createElement('div');
      card.className = 'level-card available category-card';
      card.innerHTML = `<span class="level-num">${cat.icon}</span><span class="level-info">${cat.label}<br>${cat.levels.length} 关</span>`;
      card.addEventListener('click', () => this.showLevelSelect(cat));
      grid.appendChild(card);
    }
  }

  // === Level Selection within a Category ===

  private showLevelSelect(category: LevelCategory): void {
    this.stopTimer();
    this.currentCategory = category;
    this.pendingOverlay = null;
    document.getElementById('level-select')!.classList.add('active');
    document.getElementById('game-play')!.classList.remove('active');
    document.getElementById('game-overlay')!.classList.add('hidden');
    document.getElementById('controls')!.classList.add('hidden');
    this.updateHud('', '');

    const heading = document.getElementById('level-select-heading')!;
    heading.textContent = `${category.icon} ${category.label}`;

    const grid = document.getElementById('level-grid')!;
    grid.innerHTML = '';

    // Back button
    const backCard = document.createElement('div');
    backCard.className = 'level-card available';
    backCard.innerHTML = '<span class="level-num">←</span><span class="level-info">返回</span>';
    backCard.addEventListener('click', () => this.showCategorySelect());
    grid.appendChild(backCard);

    const catIndex = this.categories.indexOf(category);
    const offset = catIndex * 10;

    const progress = this.levelManager.progressManager.getProgress();

    for (let i = 0; i < category.levels.length; i++) {
      const globalIdx = offset + i;
      const lp = progress.levels[globalIdx];
      const devUnlocked = this.devMode && i < this.devUnlockCount;
      // Within a category: first level always unlocked, rest by progress or dev
      const isUnlocked = i === 0 || lp?.unlocked || devUnlocked;

      const card = document.createElement('div');
      card.className = 'level-card';

      if (!isUnlocked) {
        card.classList.add('locked');
        card.innerHTML = `<span class="level-num">🔒</span><span class="level-info">第 ${i + 1} 关</span>`;
      } else if (lp?.completed) {
        card.classList.add('completed');
        const time = lp.bestTime ? `${(lp.bestTime / 1000).toFixed(1)}s` : '-';
        card.innerHTML = `<span class="level-num">${i + 1}</span><span class="level-info">✅ ${time}</span>`;
        card.addEventListener('click', () => this.startLevel(category, i));
      } else {
        card.classList.add('available');
        card.innerHTML = `<span class="level-num">${i + 1}</span><span class="level-info">${category.levels[i].metadata.name}</span>`;
        card.addEventListener('click', () => this.startLevel(category, i));
      }

      grid.appendChild(card);
    }
  }

  // === Game Play ===

  private startLevel(category: LevelCategory, levelIndex: number): void {
    if (levelIndex >= category.levels.length) return;

    this.currentCategory = category;
    const catIndex = this.categories.indexOf(category);
    this.globalLevelIndex = catIndex * 10 + levelIndex;

    document.getElementById('level-select')!.classList.remove('active');
    document.getElementById('game-play')!.classList.add('active');
    document.getElementById('game-overlay')!.classList.add('hidden');
    document.getElementById('controls')!.classList.remove('hidden');

    this.board = this.levelManager.loadLevel(category.levels[levelIndex], this.globalLevelIndex);
    this.renderer.setBoard(this.board);
    this.updateHud(`🚩 ${this.board.getMineCount()}`, '⏱ 0:00');
    document.getElementById('hud-status')!.textContent = `${category.icon} ${category.label} 第 ${levelIndex + 1} 关`;
  }

  private setupCanvasInput(): void {
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.board) {
        const phase = this.board.stateMachine.state.phase;
        if (phase === 'success' || phase === 'failed') {
          this.renderer.setHoveredCell(null);
          return;
        }
      }
      const rect = this.canvas.getBoundingClientRect();
      const cellId = this.renderer.cellAtPoint(e.clientX - rect.left, e.clientY - rect.top);
      this.renderer.setHoveredCell(cellId);
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.renderer.setHoveredCell(null);
    });

    this.canvas.addEventListener('click', (e) => {
      if (!this.board) return;
      const phase = this.board.stateMachine.state.phase;
      if (phase === 'success' || phase === 'failed') {
        if (this.pendingOverlay) this.pendingOverlay();
        return;
      }

      const rect = this.canvas.getBoundingClientRect();
      const cellId = this.renderer.cellAtPoint(e.clientX - rect.left, e.clientY - rect.top);
      if (cellId === null) return;

      const result = this.board.reveal(cellId);

      if (result.kind === 'safe' || result.kind === 'mine') {
        if (this.board.stateMachine.state.phase === 'playing' && !this.timerInterval) {
          this.levelManager.startTimer();
          this.startTimerDisplay();
        }
      }

      if (result.kind === 'mine') {
        this.stopTimer();
        this.levelManager.handleFailure();
        this.renderer.render();
        const cat = this.currentCategory!;
        const localIdx = this.globalLevelIndex % 10;
        const showFailOverlay = () => {
          this.showOverlay('💣 踩雷了！', `${cat.label} 第 ${localIdx + 1} 关失败`, [
            { text: '查看棋盘', action: () => this.hideOverlay(), secondary: true },
            { text: '重试', action: () => { this.pendingOverlay = null; this.retryLevel(); } },
            { text: '返回', action: () => { this.pendingOverlay = null; this.showLevelSelect(cat); }, secondary: true },
          ]);
        };
        this.pendingOverlay = showFailOverlay;
        setTimeout(showFailOverlay, 1500);
        return;
      }

      if (this.board.stateMachine.state.phase === 'success') {
        this.stopTimer();
        this.levelManager.handleCompletion();
        this.renderer.render();
        const timer = this.levelManager.getTimer();
        const time = timer ? `${(timer.getElapsedMs() / 1000).toFixed(1)}s` : '';
        const cat = this.currentCategory!;
        const localIdx = this.globalLevelIndex % 10;
        const showWinOverlay = () => {
          const buttons: { text: string; action: () => void; secondary?: boolean }[] = [
            { text: '查看棋盘', action: () => this.hideOverlay(), secondary: true },
          ];
          if (localIdx + 1 < cat.levels.length) {
            buttons.push({ text: '下一关', action: () => { this.pendingOverlay = null; this.startLevel(cat, localIdx + 1); } });
          }
          buttons.push({ text: '返回', action: () => { this.pendingOverlay = null; this.showLevelSelect(cat); }, secondary: true });
          this.showOverlay('🎉 通关成功！', `用时 ${time}`, buttons);
        };
        this.pendingOverlay = showWinOverlay;
        setTimeout(showWinOverlay, 1000);
        return;
      }

      this.renderer.render();
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (!this.board) return;
      const phase = this.board.stateMachine.state.phase;
      if (phase === 'success' || phase === 'failed') return;

      const rect = this.canvas.getBoundingClientRect();
      const cellId = this.renderer.cellAtPoint(e.clientX - rect.left, e.clientY - rect.top);
      if (cellId === null) return;

      this.board.toggleFlag(cellId);
      if (this.board.stateMachine.state.phase === 'playing' && !this.timerInterval) {
        this.levelManager.startTimer();
        this.startTimerDisplay();
      }
      this.renderer.render();
    });
  }

  private setupControls(): void {
    document.getElementById('btn-undo')!.addEventListener('click', () => {
      if (this.board?.undoLastFlag()) this.renderer.render();
    });
    document.getElementById('btn-restart')!.addEventListener('click', () => this.retryLevel());
    document.getElementById('btn-back')!.addEventListener('click', () => {
      if (this.currentCategory) this.showLevelSelect(this.currentCategory);
      else this.showCategorySelect();
    });
  }

  private setupVisibilityChange(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { this.levelManager.pauseGame(); this.levelManager.saveState(); }
      else { this.levelManager.resumeGame(); }
    });
  }

  private retryLevel(): void {
    this.stopTimer();
    this.pendingOverlay = null;
    this.levelManager.retry();
    this.renderer.render();
    document.getElementById('game-overlay')!.classList.add('hidden');
  }

  private hideOverlay(): void {
    document.getElementById('game-overlay')!.classList.add('hidden');
    document.getElementById('hud-status')!.textContent = '点击棋盘返回操作面板';
  }

  private showOverlay(title: string, subtitle: string, buttons: { text: string; action: () => void; secondary?: boolean }[]): void {
    const overlay = document.getElementById('game-overlay')!;
    const content = document.getElementById('overlay-content')!;
    overlay.classList.remove('hidden');
    let html = `<h2>${title}</h2><p>${subtitle}</p>`;
    for (let i = 0; i < buttons.length; i++) {
      html += `<button id="overlay-btn-${i}" class="${buttons[i].secondary ? 'secondary' : ''}">${buttons[i].text}</button>`;
    }
    content.innerHTML = html;
    for (let i = 0; i < buttons.length; i++) {
      document.getElementById(`overlay-btn-${i}`)!.addEventListener('click', buttons[i].action);
    }
  }

  private startTimerDisplay(): void {
    this.timerInterval = window.setInterval(() => {
      const timer = this.levelManager.getTimer();
      if (!timer) return;
      const elapsed = timer.getElapsedMs();
      const secs = Math.floor(elapsed / 1000);
      const mins = Math.floor(secs / 60);
      document.getElementById('hud-timer')!.textContent = `⏱ ${mins}:${String(secs % 60).padStart(2, '0')}`;
    }, 200);
  }

  private stopTimer(): void {
    if (this.timerInterval !== null) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }

  private updateHud(mines: string, timer: string): void {
    document.getElementById('hud-mines')!.textContent = mines;
    document.getElementById('hud-timer')!.textContent = timer;
  }
}
