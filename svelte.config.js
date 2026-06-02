import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // runtime: 'nodejs20.x' is Vercel's current default for Node functions.
    // No regions config — Vercel picks based on the user; Supabase pooler
    // is reachable from any region.
    adapter: adapter()
  }
};

export default config;
