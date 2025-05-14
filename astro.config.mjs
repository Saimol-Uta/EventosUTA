// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import netlify from '@astrojs/netlify';

import auth from 'auth-astro';

// https://astro.build/config
export default defineConfig({
    integrations: [auth()],
    vite: {
        plugins: [tailwindcss()]
    },

    adapter: netlify(),
    output: 'server',
});