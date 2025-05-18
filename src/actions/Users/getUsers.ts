import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const getUsers = defineAction({
    accept: 'form',
    input: z.object({
        fieldName: z.string().min(2)
    }),
    handler: async ({ }) => {
        // Acción
        return;
    },
});