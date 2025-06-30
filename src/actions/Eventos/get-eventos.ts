import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const getEventos = defineAction({
    accept: 'json',
    input: z.object({
        categoria: z.string().optional(),
    }),
    async handler(input) {
        try {
            const whereClause = input.categoria
                ? {
                    categorias_eventos: {
                        nom_cat: {
                            contains: input.categoria,
                            mode: 'insensitive' as const
                        }
                    }
                }
                : {}; const eventos = await prisma.eventos.findMany({
                    where: whereClause,
                    include: {
                        categorias_eventos: true,
                        organizadores: true,
                        asignaciones: true,
                    },
                    orderBy: {
                        fec_ini_eve: 'desc'
                    }
                });

            // Convertir a objetos planos usando JSON.parse(JSON.stringify())
            const eventosPlanos = JSON.parse(JSON.stringify(eventos));

            return {
                success: true,
                eventos: eventosPlanos
            };
        } catch (error) {
            console.error('Error al obtener eventos:', error);
            return {
                success: false,
                error: 'Error al obtener los eventos'
            };
        }
    }
});

export const getOrganizadorByEvento = defineAction({
    accept: 'json',
    input: z.object({
        id_evento: z.string().uuid(),
    }),
    async handler(input) {
        try {
            const evento = await prisma.eventos.findUnique({
                where: { id_eve: input.id_evento },
                include: {
                    organizadores: true
                }
            });

            if (!evento) {
                return {
                    success: false,
                    error: 'Evento no encontrado'
                };
            }

            const organizadorPlano = JSON.parse(JSON.stringify(evento.organizadores));

            return {
                success: true,
                data: organizadorPlano
            };
        } catch (error) {
            console.error('Error al obtener organizador:', error);
            return {
                success: false,
                error: 'Error al obtener el organizador'
            };
        }
    }
});

export const getCategoriaById = defineAction({
    accept: 'json',
    input: z.object({
        id_categoria: z.string().uuid(),
    }),
    async handler(input) {
        try {
            const categoria = await prisma.categorias_eventos.findUnique({
                where: { id_cat: input.id_categoria }
            });

            if (!categoria) {
                return {
                    success: false,
                    error: 'Categoría no encontrada'
                };
            }

            const categoriaPlana = JSON.parse(JSON.stringify(categoria));

            return {
                success: true,
                data: categoriaPlana
            };
        } catch (error) {
            console.error('Error al obtener categoría:', error);
            return {
                success: false,
                error: 'Error al obtener la categoría'
            };
        }
    }
});



export const getOrganizadores = defineAction({
    accept: 'json',
    input: z.object({}),
    async handler() {
        try {
            const organizadores = await prisma.organizadores.findMany({
                orderBy: {
                    nom_org1: 'asc'
                }
            });

            const organizadoresPlanos = JSON.parse(JSON.stringify(organizadores));

            return {
                success: true,
                organizadores: organizadoresPlanos
            };
        } catch (error) {
            console.error('Error al obtener organizadores:', error);
            return {
                success: false,
                error: 'Error al obtener los organizadores'
            };
        }
    }
});

export const eliminarEvento = defineAction({
    accept: 'json',
    input: z.object({
        id_evento: z.string().uuid(),
    }),
    async handler(input) {
        try {
            return await prisma.$transaction(async (tx) => {
                // 1. Verificar que el evento existe
                const eventoExistente = await tx.eventos.findUnique({
                    where: { id_eve: input.id_evento }
                });

                if (!eventoExistente) {
                    return {
                        success: false,
                        error: 'El evento no existe'
                    };
                }

                // 2. Verificar si hay inscripciones asociadas
                const inscripciones = await tx.inscripciones.count({
                    where: { id_eve_ins: input.id_evento }
                });

                if (inscripciones > 0) {
                    return {
                        success: false,
                        error: 'No se puede eliminar el evento porque tiene inscripciones asociadas'
                    };
                }

                // 3. Eliminar el evento
                await tx.eventos.delete({
                    where: { id_eve: input.id_evento }
                });

                return {
                    success: true,
                    message: 'Evento eliminado correctamente'
                };
            });
        } catch (error) {
            console.error('Error al eliminar evento:', error);
            return {
                success: false,
                error: 'Error al eliminar el evento'
            };
        }
    }
});

export const getCategorias = defineAction({
    accept: 'json',
    input: z.object({}),
    async handler() {
        try {
            const categorias = await prisma.categorias_eventos.findMany({
                orderBy: {
                    nom_cat: 'asc'
                }
            });

            const categoriasPlanas = JSON.parse(JSON.stringify(categorias));

            return {
                success: true,
                categorias: categoriasPlanas
            };
        } catch (error) {
            console.error('Error al obtener categorías:', error);
            return {
                success: false,
                error: 'Error al obtener las categorías'
            };
        }
    }
});

// === NUEVAS ACCIONES PARA CARRERAS, ASIGNACIONES Y REQUISITOS ===

export const getCarreras = defineAction({
    accept: 'json',
    input: z.object({}),
    async handler() {
        try {
            const carreras = await prisma.carreras.findMany({
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