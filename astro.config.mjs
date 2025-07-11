// @ts-check
import { defineConfig } from 'astro/config';
import auth from 'auth-astro'; // <-- Reactívalo
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

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