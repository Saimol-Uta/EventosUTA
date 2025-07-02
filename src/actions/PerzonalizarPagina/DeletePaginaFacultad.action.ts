import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';
import { ImageUpload } from '../../utils/image-upload';
import { Prisma } from '@prisma/client';

export const DeletePaginaFacultad = defineAction({
    accept: 'json',
    input: z.object({
        id_facultad: z.string().uuid(),
    }),
    async handler(input) {
        try {
            return await prisma.$transaction(async (tx) => {
                // 1. Verificar que la facultad existe
                const facultadExistente = await tx.facultades.findUnique({
                    where: { id_fac: input.id_facultad }
                });

                if (!facultadExistente) {
                    return {
                        success: false,
                        error: 'La facultad no existe'
                    };
                }

                // 2. Verificar si hay carreras asociadas
                const carreras = await tx.carreras.count({
                    where: { id_fac_per: input.id_facultad }
                });

                if (carreras > 0) {
                    return {
                        success: false,
                        error: 'No se puede eliminar la facultad porque tiene carreras asociadas'
                    };
                }

                // 3. Eliminar la facultad
                await tx.facultades.delete({
                    where: { id_fac: input.id_facultad }
                });

                return {
                    success: true,
                    message: 'Facultad eliminada correctamente'
                };
            });
        } catch (error) {
            console.error('Error al eliminar facultad:', error);
            return {
                success: false,
                error: 'Error al eliminar la facultad'
            };
        }
    }
});
