import { defineAction } from 'astro:actions';
import prisma from '../../db';

export const getInfo = defineAction({
    accept: 'json',
    handler: async () => {
        try {
            const info = await prisma.facultades.findUnique({
                where: {
                    id_pag: 1 // Siempre será 1
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