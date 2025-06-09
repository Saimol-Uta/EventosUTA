import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';


export const eliminarCategoria = defineAction({
    accept: 'json',
    input: z.object({
        id_cat: z.string().min(1, 'El ID de la categoría es requerido')
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

            // Verificar si hay eventos asociados a esta categoría
            const eventosAsociados = await prisma.eventos.findMany({
                where: { id_cat_eve: input.id_cat }
            });

            if (eventosAsociados.length > 0) {
                return {
                    success: false,
                    error: 'La categoría tiene eventos asociados',
                    message: `No se puede eliminar la categoría porque tiene ${eventosAsociados.length} evento(s) asociado(s)`
                };
            }

            // Eliminar la categoría
            await prisma.categorias_eventos.delete({
                where: { id_cat: input.id_cat }
            });

            return {
                success: true,
                message: 'Categoría eliminada exitosamente'
            };
        } catch (error) {
            console.error('Error al eliminar categoría:', error);
            return {
                success: false,
                error: 'Error al eliminar la categoría',
                message: 'No se pudo eliminar la categoría'
            };
        }
    }
});
