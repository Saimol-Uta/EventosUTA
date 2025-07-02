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
            z.number().min(0, 'El puntaje mínimo es 0').max(10, 'El puntaje máximo es 10')
        ),
        asi_cat: z.preprocess(
            val => Number(val),
            z.number().min(0, 'La asistencia mínima es 0%').max(100, 'La asistencia máxima es 100%')
        ),
        requiere_puntaje: z.preprocess(
            val => val === 'true' || val === true,
            z.boolean()
        ).optional().default(false),
        requiere_asistencia: z.preprocess(
            val => val === 'true' || val === true,
            z.boolean()
        ).optional().default(false),
        brinda_certificado: z.preprocess(
            val => val === 'true' || val === true,
            z.boolean()
        ).optional().default(false)
    }),
    handler: async (input) => {
        try {

             const dataToUpdate = {
                nom_cat: input.nom_cat,
                des_cat: input.des_cat,
                requiere_puntaje: input.requiere_puntaje,
                requiere_asistencia: input.requiere_asistencia,
                brinda_certificado: input.brinda_certificado,
                // Si no se requiere puntaje, forzamos a 0. Si sí, usamos el valor del input.
                pun_apr_cat: input.requiere_puntaje ? input.pun_apr_cat : 7,
                // Si no se requiere asistencia, forzamos a 0. Si sí, usamos el valor del input.
                asi_cat: input.requiere_asistencia ? input.asi_cat : 70,
            };

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
                where: { id_cat: input.id_cat },
                data: dataToUpdate
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
