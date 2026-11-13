import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Keep Vite's generated cache in a fresh folder so a stale OneDrive-locked
  // node_modules cache cannot prevent the dev server from starting.
  cacheDir: '.vite-cache',
});
