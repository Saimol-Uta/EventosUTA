import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';
import { ImageUpload } from '../../utils/image-upload';
import { Prisma } from '@prisma/client';

export const getFacultadById = defineAction({
    accept: 'json',
    input: z.object({
        id_facultad: z.string().uuid(),
    }),
    async handler(input) {
        try {
            const facultad = await prisma.facultades.findUnique({
                where: { id_fac: input.id_facultad }
            });

            if (!facultad) {
                return {
                    success: false,
                    error: 'Facultad no encontrada'
                };
            }

            const facultadPlana = JSON.parse(JSON.stringify(facultad));

            return {
                success: true,
                data: facultadPlana
            };
        } catch (error) {
            console.error('Error al obtener facultad:', error);
            return {
                success: false,
                error: 'Error al obtener la facultad'
            };
        }
    }
});

