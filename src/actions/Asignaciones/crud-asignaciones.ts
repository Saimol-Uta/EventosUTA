import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

/**
 * Obtener todas las asignaciones del sistema
 */
export const getAllAsignaciones = defineAction({
    accept: 'json',
    input: z.object({}),
    async handler() {
        try {
            // Obtener todas las asignaciones con sus detalles
            const asignaciones = await prisma.asignaciones.findMany({
                include: {
                    detalle_asignaciones: {
                        include: {
                            carreras: true
                        }
                    },
                    eventos: true
                },
                orderBy: {
                    nom_asi: 'asc'
                }
            });

            const asignacionesPlanas = JSON.parse(JSON.stringify(asignaciones));

            return {
                success: true,
                asignaciones: asignacionesPlanas
            };
        } catch (error) {
            console.error('Error al obtener todas las asignaciones:', error);
            return {
                success: false,
                error: 'Error al obtener las asignaciones'
            };
        }
    }
});

/**
 * Crear una nueva asignación completa con carreras asociadas
 */
export const crearAsignacionCompleta = defineAction({
    accept: 'json',
    input: z.object({
        nom_asi: z.string().min(1, 'El nombre es requerido'),
        des_asi: z.string().min(1, 'La descripción es requerida'),
        tip_asi: z.string().default('GENERAL'),
        carreras: z.array(z.string()).optional() // IDs de carreras
    }),
    async handler(input) {
        try {
            const result = await prisma.$transaction(async (tx) => {
                const asignacion = await tx.asignaciones.create({
                    data: {
                        nom_asi: input.nom_asi,
                        des_asi: input.des_asi,
                        tip_asi: input.tip_asi,
                    }
                });

                // Crear las relaciones con carreras si existen
                if (input.carreras && input.carreras.length > 0) {
                    await tx.detalle_asignaciones.createMany({
                        data: input.carreras.map(carreraId => ({
                            id_asi: asignacion.id_asi,
                            id_car: carreraId
                        }))
                    });
                }

                return asignacion;
            });

            return {
                success: true,
                asignacion: JSON.parse(JSON.stringify(result))
            };
        } catch (error) {
            console.error('Error al crear asignación independiente:', error);
            return {
                success: false,
                error: 'Error al crear la asignación'
            };
        }
    }
});

/**
 * Modificar una asignación existente y sus carreras asociadas
 */
export const modificarAsignacionCompleta = defineAction({
    accept: 'json',
    input: z.object({
        id_asignacion: z.string(),
        nom_asi: z.string().min(1, 'El nombre es requerido'),
        des_asi: z.string().min(1, 'La descripción es requerida'),
        tip_asi: z.string().default('GENERAL'),
        carreras: z.array(z.string()).optional() // IDs de carreras
    }),
    async handler(input) {
        try {
            const result = await prisma.$transaction(async (tx) => {
                // Actualizar la asignación
                const asignacion = await tx.asignaciones.update({
                    where: { id_asi: input.id_asignacion },
                    data: {
                        nom_asi: input.nom_asi,
                        des_asi: input.des_asi,
                        tip_asi: input.tip_asi
                    }
                });

                // Eliminar relaciones existentes con carreras
                await tx.detalle_asignaciones.deleteMany({
                    where: { id_asi: input.id_asignacion }
                });

                // Crear nuevas relaciones con carreras
                if (input.carreras && input.carreras.length > 0) {
                    await tx.detalle_asignaciones.createMany({
                        data: input.carreras.map(carreraId => ({
                            id_asi: input.id_asignacion,
                            id_car: carreraId
                        }))
                    });
                }

                return asignacion;
            });

            return {
                success: true,
                asignacion: JSON.parse(JSON.stringify(result))
            };
        } catch (error) {
            console.error('Error al modificar asignación:', error);
            return {
                success: false,
                error: 'Error al modificar la asignación'
            };
        }
    }
});

/**
 * Eliminar una asignación completa
 */
export const eliminarAsignacionCompleta = defineAction({
    accept: 'json',
    input: z.object({
        id_asignacion: z.string()
    }),
    async handler(input) {
        try {
            await prisma.asignaciones.delete({
                where: {
                    id_asi: input.id_asignacion
                }
            });

            return {
                success: true,
                message: 'Asignación eliminada correctamente'
            };
        } catch (error) {
            console.error('Error al eliminar asignación:', error);
            return {
                success: false,
                error: 'Error al eliminar la asignación'
            };
        }
    }
});

/**
 * Obtener una asignación por ID con todos sus detalles
 */
export const getAsignacionById = defineAction({
    accept: 'json',
    input: z.object({
        id_asignacion: z.string()
    }),
    async handler(input) {
        try {
            const asignacion = await prisma.asignaciones.findUnique({
                where: { id_asi: input.id_asignacion },
                include: {
                    detalle_asignaciones: {
                        include: {
                            carreras: true
                        }
                    },
                    eventos: true
                }
            });

            if (!asignacion) {
                return {
                    success: false,
                    error: 'Asignación no encontrada'
                };
            }

            return {
                success: true,
                asignacion: JSON.parse(JSON.stringify(asignacion))
            };
        } catch (error) {
            console.error('Error al obtener asignación:', error);
            return {
                success: false,
                error: 'Error al obtener la asignación'
            };
        }
    }
});
