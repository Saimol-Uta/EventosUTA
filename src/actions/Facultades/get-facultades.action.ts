import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const getAllFacultades = defineAction({
    accept: 'json',
    input: z.object({}),
    async handler() {
        try {
            const facultades = await prisma.facultades.findMany({
                include: {
                    carreras: {
                        select: {
                            id_car: true,
                            nom_car: true,
                            cod_car: true
                        }
                    }
                },
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

export const getFacultadById = defineAction({
    accept: 'json',
    input: z.object({
        id_fac: z.string().uuid('ID de facultad inválido'),
    }),
    async handler(input) {
        try {
            const facultad = await prisma.facultades.findUnique({
                where: { id_fac: input.id_fac },
                include: {
                    carreras: {
                        select: {
                            id_car: true,
                            nom_car: true,
                            cod_car: true,
                            des_car: true
                        }
                    }
                }
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
                facultad: facultadPlana
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
