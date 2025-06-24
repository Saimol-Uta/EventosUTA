// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import auth from 'auth-astro';

import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  integrations: [auth()],

  vite: {
      plugins: [tailwindcss()]
  },

  output: 'server',

  adapter: node({
    mode: 'standalone'
  })
});