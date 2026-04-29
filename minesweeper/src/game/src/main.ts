import { GameApp } from './app.js';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new GameApp();
  await app.init();
});
