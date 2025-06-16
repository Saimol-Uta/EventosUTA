import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

/**
 * Obtener asignaciones por evento específico
 */
export const getAsignacionesByEvento = defineAction({
    accept: 'json',
    input: z.object({
        id_evento: z.string()
    }),
    async handler(input) {
        try {
            // Buscar el evento y su asignación asociada
            const evento = await prisma.eventos.findUnique({
                where: { id_eve: input.id_evento },
                include: {
                    asignaciones: {
                        include: {
                            detalle_asignaciones: {
                                include: {
                                    carreras: true
                                }
                            }
                        }
                    }
                }
            });

            if (!evento) {
                return {
                    success: false,
                    error: 'Evento no encontrado'
                };
            }

            const asignacionesPlanas = JSON.parse(JSON.stringify(evento.asignaciones));

            return {
                success: true,
                asignaciones: asignacionesPlanas ? [asignacionesPlanas] : []
            };
        } catch (error) {
            console.error('Error al obtener asignaciones:', error);
            return {
                success: false,
                error: 'Error al obtener las asignaciones'
            };
        }
    }
});

/**
 * Crear asignación específica para un evento
 */
export const crearAsignacion = defineAction({
    accept: 'json',
    input: z.object({
        nom_asi: z.string().min(1, 'El nombre es requerido'),
        des_asi: z.string().min(1, 'La descripción es requerida'),
        tip_asi: z.string().default('GENERAL'),
        id_evento: z.string(),
        carreras: z.array(z.string()).optional()
    }),
    async handler(input) {
        try {
            const result = await prisma.$transaction(async (tx) => {
                // Crear la asignación
                const asignacion = await tx.asignaciones.create({
                    data: {
                        nom_asi: input.nom_asi,
                        des_asi: input.des_asi,
                        tip_asi: input.tip_asi
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

                // Asociar la asignación al evento
                await tx.eventos.update({
                    where: { id_eve: input.id_evento },
                    data: { id_asi_eve: asignacion.id_asi }
                });

                return asignacion;
            });

            return {
                success: true,
                asignacion: JSON.parse(JSON.stringify(result))
            };
        } catch (error) {
            console.error('Error al crear asignación:', error);
            return {
                success: false,
                error: 'Error al crear la asignación'
            };
        }
    }
});

/**
 * Eliminar asignación de un evento
 */
export const eliminarAsignacion = defineAction({
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
 * Modificar asignación de un evento
 */
export const modificarAsignacion = defineAction({
    accept: 'json',
    input: z.object({
        id_asignacion: z.string(),
        nom_asi: z.string().min(1, 'El nombre es requerido'),
        des_asi: z.string().min(1, 'La descripción es requerida'),
        tip_asi: z.string().default('GENERAL'),
        carreras: z.array(z.string()).optional()
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
