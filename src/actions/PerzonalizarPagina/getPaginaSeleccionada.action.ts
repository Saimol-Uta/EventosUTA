import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';
import { ImageUpload } from '../../utils/image-upload';
import { Prisma } from '@prisma/client';

export const getPaginaSeleccionada = defineAction({
    accept: 'json',
    input: z.object({}),
    handler: async () => {
        try {
            const facultadActiva = await prisma.facultades.findFirst({
                where: {
                    est_fac: true
                }
            });

            if (!facultadActiva) {
                return {
                    success: false,
                    message: 'No se encontró ninguna facultad activa',
                    facultad: null
                };
            }

            return {
                success: true,
                message: 'Facultad activa obtenida correctamente',
                facultad: facultadActiva
            };

        } catch (error: any) {
            console.error('Error al obtener la facultad activa:', error);
            return {
                success: false,
                message: 'Error al obtener la facultad activa',
                error: error.message,
                facultad: null
            };
        }
    }
});

export const activarFacultad = defineAction({
    accept: 'json',
    input: z.object({
        id_facultad: z.string().uuid('ID de facultad debe ser un UUID válido')
    }),
    handler: async ({ id_facultad }) => {
        try {
            // Verificar que la facultad existe
            const facultadExiste = await prisma.facultades.findUnique({
                where: { id_fac: id_facultad },
                select: { id_fac: true, nom_fac: true }
            });

            if (!facultadExiste) {
                return {
                    success: false,
                    message: 'La facultad especificada no existe',
                    error: 'FACULTAD_NO_ENCONTRADA'
                };
            }

            // Usar transacción para garantizar consistencia
            await prisma.$transaction(async (tx) => {
                // Paso 1: Desactivar todas las facultades
                await tx.facultades.updateMany({
                    data: { est_fac: false }
                });

                // Paso 2: Activar solo la facultad seleccionada
                await tx.facultades.update({
                    where: { id_fac: id_facultad },
                    data: { est_fac: true }
                });
            });

            return {
                success: true,
                message: `Facultad "${facultadExiste.nom_fac}" activada correctamente`,
                facultad_activada: {
                    id_fac: facultadExiste.id_fac,
                    nom_fac: facultadExiste.nom_fac
                }
            };

        } catch (error: any) {
            console.error('Error al activar facultad:', error);
            return {
                success: false,
                message: 'Error al activar la facultad',
                error: error.message
            };
        }
    }
});

export const desactivarTodasFacultades = defineAction({
    accept: 'json',
    input: z.object({}),
    handler: async () => {
        try {
            // Desactivar todas las facultades
            const resultado = await prisma.facultades.updateMany({
                data: { est_fac: false }
            });

            return {
                success: true,
                message: `Se desactivaron ${resultado.count} facultades`,
                facultades_desactivadas: resultado.count
            };

        } catch (error: any) {
            console.error('Error al desactivar facultades:', error);
            return {
                success: false,
                message: 'Error al desactivar las facultades',
                error: error.message
            };
        }
    }
});