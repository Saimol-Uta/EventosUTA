import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';


export const getAllCategorias = defineAction({
    accept: 'json',
    input: z.object({}).optional(),
    handler: async () => {
        try {
            const categorias = await prisma.categorias_eventos.findMany({
                orderBy: {
                    nom_cat: 'asc'
                }
            });

            return {
                success: true,
                categorias
            };
        } catch (error) {
            console.error('Error al obtener categorías:', error);
            return {
                success: false,
                error: 'Error al obtener las categorías',
                categorias: []
            };
        }
    }
});
