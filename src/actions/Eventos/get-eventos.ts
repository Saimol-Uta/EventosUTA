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
                : {};

            const eventos = await prisma.eventos.findMany({
                where: whereClause,
                include: {
                    categorias_eventos: true,
                    organizadores: true,
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

export const crearEvento = defineAction({
    accept: 'json', input: z.object({
        nombre: z.string().min(1),
        descripcion: z.string().min(1),
        categoria: z.string().uuid(), // Ahora esperamos un UUID de categoría
        area: z.enum(['PRACTICA', 'INVESTIGACION', 'ACADEMICA', 'TECNICA', 'INDUSTRIAL', 'EMPRESARIAL', 'IA', 'REDES']).optional(),
        precio: z.number().min(0),
        fecha_inicio: z.string().transform(str => new Date(str)),
        hora_inicio: z.string(),
        fecha_fin: z.string().nullable().optional().transform(str => str ? new Date(str) : undefined),
        hora_fin: z.string().nullable().optional(),
        duracion: z.number().nullable().optional(),
        ubicacion: z.string().min(1),
        cedula_organizador: z.string().min(10).max(10),
        imagen: z.string().optional(),
    }),
    async handler(input) {
        try {
            return await prisma.$transaction(async (tx) => {
                // 1. Verificar que el organizador existe
                const organizador = await tx.organizadores.findUnique({
                    where: { ced_org: input.cedula_organizador }
                });

                if (!organizador) {
                    return {
                        success: false,
                        error: 'El organizador no existe en el sistema'
                    };
                }                // 2. Verificar que la categoría existe
                const categoria = await tx.categorias_eventos.findUnique({
                    where: { id_cat: input.categoria }
                });

                if (!categoria) {
                    return {
                        success: false,
                        error: 'La categoría especificada no existe'
                    };
                }

                // 3. Crear el evento
                const nuevoEvento = await tx.eventos.create({
                    data: {
                        nom_eve: input.nombre,
                        des_eve: input.descripcion,
                        id_cat_eve: input.categoria, // Usar directamente el ID
                        fec_ini_eve: input.fecha_inicio,
                        fec_fin_eve: input.fecha_fin,
                        hor_ini_eve: new Date(`1970-01-01T${input.hora_inicio}:00`),
                        hor_fin_eve: input.hora_fin ? new Date(`1970-01-01T${input.hora_fin}:00`) : undefined,
                        dur_eve: input.duracion,
                        are_eve: input.area,
                        ubi_eve: input.ubicacion,
                        ced_org_eve: input.cedula_organizador,
                        img_eve: input.imagen,
                        precio: input.precio
                    }
                });

                // Convertir a objeto plano
                const eventoSerializable = JSON.parse(JSON.stringify(nuevoEvento));

                return {
                    success: true,
                    message: 'Evento creado correctamente',
                    evento: eventoSerializable
                };
            });
        } catch (error) {
            console.error('Error al crear evento:', error);
            return {
                success: false,
                error: 'Error al crear el evento'
            };
        }
    }
});

export const modificarEvento = defineAction({
    accept: 'json',
    input: z.object({
        evento_id: z.string().uuid(),
        nombre: z.string().min(1),
        descripcion: z.string().min(1),
        categoria: z.string().uuid(), // Ahora esperamos un UUID de categoría
        area: z.enum(['PRACTICA', 'INVESTIGACION', 'ACADEMICA', 'TECNICA', 'INDUSTRIAL', 'EMPRESARIAL', 'IA', 'REDES']).optional(),
        precio: z.number().min(0),
        fecha_inicio: z.string().transform(str => new Date(str)),
        hora_inicio: z.string(),
        fecha_fin: z.string().nullable().optional().transform(str => str ? new Date(str) : undefined),
        hora_fin: z.string().nullable().optional(),
        duracion: z.number().nullable().optional(),
        ubicacion: z.string().min(1),
        cedula_organizador: z.string().min(10).max(10),
        imagen: z.string().optional(),
    }),
    async handler(input) {
        try {
            return await prisma.$transaction(async (tx) => {
                // 1. Verificar que el evento existe
                const eventoExistente = await tx.eventos.findUnique({
                    where: { id_eve: input.evento_id }
                });

                if (!eventoExistente) {
                    return {
                        success: false,
                        error: 'El evento no existe'
                    };
                }

                // 2. Verificar que el organizador existe
                const organizador = await tx.organizadores.findUnique({
                    where: { ced_org: input.cedula_organizador }
                });

                if (!organizador) {
                    return {
                        success: false,
                        error: 'El organizador no existe en el sistema'
                    };
                }

                // 3. Verificar que la categoría existe
                const categoria = await tx.categorias_eventos.findUnique({
                    where: { id_cat: input.categoria }
                });

                if (!categoria) {
                    return {
                        success: false,
                        error: 'La categoría especificada no existe'
                    };
                }                // 4. Actualizar el evento
                const eventoActualizado = await tx.eventos.update({
                    where: { id_eve: input.evento_id },
                    data: {
                        nom_eve: input.nombre,
                        des_eve: input.descripcion,
                        id_cat_eve: input.categoria, // Usar directamente el UUID
                        fec_ini_eve: input.fecha_inicio,
                        fec_fin_eve: input.fecha_fin,
                        hor_ini_eve: new Date(`1970-01-01T${input.hora_inicio}:00`),
                        hor_fin_eve: input.hora_fin ? new Date(`1970-01-01T${input.hora_fin}:00`) : undefined,
                        dur_eve: input.duracion,
                        are_eve: input.area,
                        ubi_eve: input.ubicacion,
                        ced_org_eve: input.cedula_organizador,
                        img_eve: input.imagen,
                        precio: input.precio
                    }
                });

                // Convertir a objeto plano
                const eventoSerializable = JSON.parse(JSON.stringify(eventoActualizado));

                return {
                    success: true,
                    message: 'Evento actualizado correctamente',
                    evento: eventoSerializable
                };
            });
        } catch (error) {
            console.error('Error al modificar evento:', error);
            return {
                success: false,
                error: 'Error al modificar el evento'
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