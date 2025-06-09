// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import clerk from "@clerk/astro";
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
    integrations: [clerk()],
    vite: {
        plugins: [tailwindcss()]
    },
    output: 'server',
    adapter: netlify(),
});