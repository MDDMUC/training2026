import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5173,
    strictPort: false
  },
  // better-sqlite3 is a native module — must not be bundled for the server.
  ssr: {
    external: ['better-sqlite3']
  }
});
