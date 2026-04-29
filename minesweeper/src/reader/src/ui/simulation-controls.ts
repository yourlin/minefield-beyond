/**
 * Set up simulation control buttons.
 */
export function setupSimControls(callbacks: {
  onRevealAll: () => void;
  onReset: () => void;
  onToggleMines: (show: boolean) => void;
}): void {
  const btnRevealAll = document.getElementById('btn-reveal-all') as HTMLButtonElement;
  const btnReset = document.getElementById('btn-reset') as HTMLButtonElement;
  const chkShowMines = document.getElementById('chk-show-mines') as HTMLInputElement;

  btnRevealAll.addEventListener('click', callbacks.onRevealAll);
  btnReset.addEventListener('click', callbacks.onReset);
  chkShowMines.addEventListener('change', () => {
    callbacks.onToggleMines(chkShowMines.checked);
  });
}

/**
 * Enable simulation controls.
 */
export function enableControls(): void {
  (document.getElementById('btn-reveal-all') as HTMLButtonElement).disabled = false;
  (document.getElementById('btn-reset') as HTMLButtonElement).disabled = false;
}

/**
 * Disable simulation controls.
 */
export function disableControls(): void {
  (document.getElementById('btn-reveal-all') as HTMLButtonElement).disabled = true;
  (document.getElementById('btn-reset') as HTMLButtonElement).disabled = true;
}
