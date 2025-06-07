import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const getAllCarreras = defineAction({
    accept: 'json',
    input: z.object({}),
    async handler() {
        try {
            const carreras = await prisma.carreras.findMany({
                include: {
                    asignaciones: {
                        select: {
                            id_asi: true,
                            nom_asi: true
                        }
                    },
                    usuarios: {
                        select: {
                            id_usu: true,
                            nom_usu1: true,
                            ape_usu1: true
                        }
                    }
                },
                orderBy: {
                    nom_car: 'asc'
                }
            });

            const carrerasPlanas = JSON.parse(JSON.stringify(carreras));

            return {
                success: true,
                carreras: carrerasPlanas
            };
        } catch (error) {
            console.error('Error al obtener carreras:', error);
            return {
                success: false,
                error: 'Error al obtener las carreras'
            };
        }
    }
});

export const getCarreraById = defineAction({
    accept: 'json',
    input: z.object({
        id_car: z.string().uuid('ID de carrera inválido'),
    }),
    async handler(input) {
        try {
            const carrera = await prisma.carreras.findUnique({
                where: { id_car: input.id_car },
                include: {
                    asignaciones: {
                        select: {
                            id_asi: true,
                            nom_asi: true,
                            des_asi: true
                        }
                    },
                    usuarios: {
                        select: {
                            id_usu: true,
                            nom_usu1: true,
                            ape_usu1: true,
                            ced_usu: true
                        }
                    }
                }
            });

            if (!carrera) {
                return {
                    success: false,
                    error: 'Carrera no encontrada'
                };
            }

            const carreraPlana = JSON.parse(JSON.stringify(carrera));

            return {
                success: true,
                carrera: carreraPlana
            };
        } catch (error) {
            console.error('Error al obtener carrera:', error);
            return {
                success: false,
                error: 'Error al obtener la carrera'
            };
        }
    }
});
