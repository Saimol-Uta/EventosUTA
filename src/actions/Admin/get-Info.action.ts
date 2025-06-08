import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const getInfo = defineAction({
    accept: 'json',
    input: z.object({
        id: z.number()
    }),
    handler: async ({ id }) => {
        try {
            const info = await prisma.pagina_principal.findUnique({
                where: {
                    id_pag: id
                }
            });

            if (!info) {
                throw new Error('Información no encontrada');
            }

            return {
                success: true,
                data: info
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    },
});