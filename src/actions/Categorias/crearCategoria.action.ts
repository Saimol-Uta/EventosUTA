import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';


export const crearCategoria = defineAction({
    accept: 'form',
    input: z.object({
        nom_cat: z.string().min(1, 'El nombre de la categoría es requerido'),
        des_cat: z.string().min(1, 'La descripción de la categoría es requerida'),
        pun_apr_cat: z.preprocess(
            val => Number(val),
            z.number().min(0).max(10, 'El puntaje debe estar entre 0 y 10')
        ), asi_cat: z.preprocess(
            val => Number(val),
            z.number().min(0).max(100, 'La asistencia debe estar entre 0 y 100')
        )
    }),
    handler: async (input) => {
        try {
            // Crear la nueva categoría
            const nuevaCategoria = await prisma.categorias_eventos.create({
                data: {
                    nom_cat: input.nom_cat,
                    des_cat: input.des_cat,
                    pun_apr_cat: input.pun_apr_cat,
                    asi_cat: input.asi_cat
                }
            });

            const CategoriaNuevoPlano = JSON.parse(JSON.stringify(nuevaCategoria));

            return {
                success: true,
                data: CategoriaNuevoPlano,
                message: 'Categoría creada exitosamente'
            };
        } catch (error) {
            console.error('Error al crear categoría:', error);
            return {
                success: false,
                error: 'Error al crear la categoría',
                message: 'No se pudo crear la categoría'
            };
        }
    }
});
