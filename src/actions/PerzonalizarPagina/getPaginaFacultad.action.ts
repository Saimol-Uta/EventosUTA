import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const GetPaginaFacultad = defineAction({
    accept: 'json',
    input: z.object({}),
    async handler() {
        try {
            const facultades = await prisma.facultades.findMany({
                orderBy: {
                    nom_fac: 'asc'
                }
            });

            const facultadesPlanas = JSON.parse(JSON.stringify(facultades));

            return {
                success: true,
                facultades: facultadesPlanas
            };
        } catch (error) {
            console.error('Error al obtener facultades:', error);
            return {
                success: false,
                error: 'Error al obtener las facultades'
            };
        }
    }
});

