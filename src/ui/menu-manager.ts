import { getTableTranslation, i18n } from '../i18n';
import type { LocaleCode, TableId, TranslationDictionary } from '../i18n/types';
import type { PinballSimulation } from '../physics/engine';
import type { AudioManager } from '../audio/audio-manager';

export interface HighScoreEntry {
  name: string;
  score: number;
  table: TableId;
  date: string;
}

const STORAGE_HISCORES = '3dpinball_highscores';

export class MenuManager {
  private sim: PinballSimulation;
  private audio: AudioManager;
  private highScores: HighScoreEntry[] = [];
  private activeDropdown: string | null = null;
  private onTableSelected?: (id: TableId) => void;

  constructor(sim: PinballSimulation, audio: AudioManager, onTableSelected?: (id: TableId) => void) {
    this.sim = sim;
    this.audio = audio;
    this.onTableSelected = onTableSelected;
    this.loadHighScores();
    this.setupDropdownListeners();
    this.setupModalListeners();

    i18n.subscribe((dict) => {
      this.updateI18nLabels(dict);
    });
    this.updateI18nLabels(i18n.t);
  }

  private loadHighScores(): void {
    try {
      const data = localStorage.getItem(STORAGE_HISCORES);
      if (data) {
        this.highScores = JSON.parse(data);
        return;
      }
    } catch {
      // Fallback
    }

    // Authentic default high scores
    this.highScores = [
      { name: 'K. PETERS', score: 12500000, table: 'outpost', date: '1995-10-15' },
      { name: 'R. CARPENTER', score: 8750000, table: 'command_post', date: '1995-10-18' },
      { name: 'M. REIDER', score: 6200000, table: 'mine', date: '1995-10-22' },
      { name: 'A. ROBERTS', score: 4100000, table: 'outpost', date: '1995-10-25' },
      { name: 'D. JACKSON', score: 2500000, table: 'command_post', date: '1995-10-30' },
    ];
    this.saveHighScores();
  }

  public recordScoreIfEligible(score: number, table: TableId): boolean {
    if (score <= 0) return false;
    const lowest = this.highScores[this.highScores.length - 1]?.score ?? 0;
    if (this.highScores.length < 5 || score > lowest) {
      const entry: HighScoreEntry = {
        name: 'PLAYER 1',
        score,
        table,
        date: new Date().toISOString().split('T')[0],
      };
      this.highScores.push(entry);
      this.highScores.sort((a, b) => b.score - a.score);
      this.highScores = this.highScores.slice(0, 5);
      this.saveHighScores();
      return true;
    }
    return false;
  }

  private saveHighScores(): void {
    try {
      localStorage.setItem(STORAGE_HISCORES, JSON.stringify(this.highScores));
    } catch {
      // Ignore
    }
  }

  private setupDropdownListeners(): void {
    const menuButtons = document.querySelectorAll<HTMLButtonElement>('.menu-bar-btn');
    menuButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const menuId = btn.getAttribute('data-menu');
        if (this.activeDropdown === menuId) {
          this.closeDropdowns();
        } else {
          this.openDropdown(menuId);
        }
      });
    });

    document.addEventListener('click', () => {
      this.closeDropdowns();
    });

    // Sub-item actions
    const menuItems = document.querySelectorAll<HTMLElement>('.dropdown-item');
    menuItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeDropdowns();
        const action = item.getAttribute('data-action');
        this.handleMenuAction(action, item);
      });
    });
  }

  private openDropdown(menuId: string | null): void {
    this.closeDropdowns();
    if (!menuId) return;
    this.activeDropdown = menuId;
    const menu = document.getElementById(`dropdown-${menuId}`);
    if (menu) {
      menu.classList.add('visible');
    }
  }

  public closeDropdowns(): void {
    this.activeDropdown = null;
    const openMenus = document.querySelectorAll('.dropdown-menu.visible');
    openMenus.forEach((m) => m.classList.remove('visible'));
  }

  private handleMenuAction(action: string | null, element: HTMLElement): void {
    if (!action) return;

    switch (action) {
      case 'new-game':
        this.sim.startNewGame();
        break;
      case 'pause':
        this.sim.paused = !this.sim.paused;
        break;
      case 'high-scores':
        this.openModal('modal-scores');
        this.renderHighScoresTable();
        break;
      case 'table-outpost':
        this.onTableSelected?.('outpost');
        break;
      case 'table-cp':
        this.onTableSelected?.('command_post');
        break;
      case 'table-mine':
        this.onTableSelected?.('mine');
        break;
      case 'table-picker':
        this.openModal('modal-tables');
        break;
      case 'toggle-sfx': {
        const on = this.audio.toggleSfx();
        element.setAttribute('data-checked', on ? 'true' : 'false');
        break;
      }
      case 'toggle-music': {
        const on = this.audio.toggleMusic();
        element.setAttribute('data-checked', on ? 'true' : 'false');
        break;
      }
      case 'fullscreen':
        this.toggleFullscreen();
        break;
      case 'set-locale': {
        const locale = element.getAttribute('data-locale') as LocaleCode;
        if (locale) {
          i18n.setLocale(locale);
        }
        break;
      }
      case 'controls':
        this.openModal('modal-controls');
        break;
      case 'credits':
        this.openModal('modal-credits');
        break;
      default:
        break;
    }
  }

  private setupModalListeners(): void {
    const closeButtons = document.querySelectorAll<HTMLButtonElement>('.modal-close, .btn-dialog-close');
    closeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
      });
    });

    const overlays = document.querySelectorAll<HTMLElement>('.modal-overlay');
    overlays.forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });

    // Table modal selections
    const tableCards = document.querySelectorAll<HTMLElement>('.table-choice-card');
    tableCards.forEach((card) => {
      card.addEventListener('click', () => {
        const tableId = card.getAttribute('data-table') as TableId;
        if (tableId) {
          this.onTableSelected?.(tableId);
          this.closeAllModals();
        }
      });
    });
  }

  public openModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
    }
  }

  public closeAllModals(): void {
    const activeModals = document.querySelectorAll('.modal-overlay.active');
    activeModals.forEach((m) => m.classList.remove('active'));
  }

  private toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  private renderHighScoresTable(): void {
    const tbody = document.getElementById('high-scores-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const dict = i18n.t;
    this.highScores.forEach((entry, idx) => {
      const tr = document.createElement('tr');
      const rank = idx + 1;
      const tableName = getTableTranslation(dict, entry.table).name;
      tr.innerHTML = `
        <td class="col-rank">#${rank}</td>
        <td class="col-name">${entry.name}</td>
        <td class="col-score">${entry.score.toLocaleString()}</td>
        <td class="col-table">${tableName}</td>
        <td class="col-date">${entry.date}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  public updateI18nLabels(dict: TranslationDictionary): void {
    // Menu Bar
    this.setText('#menu-btn-game', dict.menus.game);
    this.setText('#menu-btn-options', dict.menus.options);
    this.setText('#menu-btn-table', dict.menus.table);
    this.setText('#menu-btn-language', dict.menus.language);
    this.setText('#menu-btn-help', dict.menus.help);

    // Dropdown Items
    this.setText('#item-new-game', dict.menus.newGame);
    this.setText('#item-pause', dict.menus.pause);
    this.setText('#item-high-scores', dict.menus.highScores);
    this.setText('#item-sfx', dict.menus.soundEffects);
    this.setText('#item-music', dict.menus.music);
    this.setText('#item-select-table', dict.menus.selectTable);
    this.setText('#item-controls', dict.menus.controls);
    this.setText('#item-credits', dict.menus.credits);

    // Modals
    this.setText('#modal-title-scores', dict.modals.highScoresTitle);
    this.setText('#modal-title-controls', dict.modals.controlsTitle);
    this.setText('#modal-title-credits', dict.modals.creditsTitle);
    this.setText('#modal-title-tables', dict.menus.selectTable);

    // Mobile buttons
    this.setText('#btn-touch-flipper-left', `◄ ${dict.mobile.leftFlipper}`);
    this.setText('#btn-touch-flipper-right', `${dict.mobile.rightFlipper} ►`);
    this.setText('#btn-touch-plunger', dict.mobile.launch);
    this.setText('#btn-touch-nudge-left', `⇦ ${dict.mobile.nudgeLeft}`);
    this.setText('#btn-touch-nudge-up', `⇧ ${dict.mobile.nudgeUp}`);
    this.setText('#btn-touch-nudge-right', `${dict.mobile.nudgeRight} ⇨`);

    // Dialog close buttons
    const closeBtns = document.querySelectorAll('.btn-dialog-close');
    closeBtns.forEach((b) => {
      b.textContent = dict.modals.close;
    });
  }

  private setText(selector: string, text: string): void {
    const el = document.querySelector(selector);
    if (el) {
      el.textContent = text;
    }
  }
}
