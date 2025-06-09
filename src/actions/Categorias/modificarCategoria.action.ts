import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';


export const modificarCategoria = defineAction({
    accept: 'form',
    input: z.object({
        id_cat: z.string().min(1, 'El ID de la categoría es requerido'),
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
            // Verificar que la categoría existe
            const categoriaExistente = await prisma.categorias_eventos.findUnique({
                where: { id_cat: input.id_cat }
            });

            if (!categoriaExistente) {
                return {
                    success: false,
                    error: 'La categoría no existe',
                    message: 'No se encontró la categoría especificada'
                };
            }

            // Actualizar la categoría
            const categoriaActualizada = await prisma.categorias_eventos.update({
                where: { id_cat: input.id_cat }, data: {
                    nom_cat: input.nom_cat,
                    des_cat: input.des_cat,
                    pun_apr_cat: input.pun_apr_cat,
                    asi_cat: input.asi_cat
                }
            });

            const CategoriaActualizadaPlano = JSON.parse(JSON.stringify(categoriaActualizada));

            return {
                success: true,
                data: CategoriaActualizadaPlano,
                message: 'Categoría actualizada exitosamente'
            };
        } catch (error) {
            console.error('Error al modificar categoría:', error);
            return {
                success: false,
                error: 'Error al modificar la categoría',
                message: 'No se pudo actualizar la categoría'
            };
        }
    }
});
