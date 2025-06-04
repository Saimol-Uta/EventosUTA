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

export const getAsignacionesByEvento = defineAction({
    accept: 'json',
    input: z.object({
        id_evento: z.string()
    }),
    async handler(input) {
        try {
            const asignaciones = await prisma.asignaciones.findMany({
                where: {
                    id_eve_per: input.id_evento
                },
                include: {
                    carreras: true,
                    requisitos: true
                }
            });

            const asignacionesPlanas = JSON.parse(JSON.stringify(asignaciones));

            return {
                success: true,
                asignaciones: asignacionesPlanas
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

export const crearAsignacion = defineAction({
    accept: 'json',
    input: z.object({
        nom_asi: z.string().min(1, 'El nombre es requerido'),
        des_asi: z.string().min(1, 'La descripción es requerida'),
        id_car_asi: z.string().nullable().optional(),
        es_publico_general: z.boolean().default(false),
        es_gratuito: z.boolean().default(false),
        requiere_validacion: z.boolean().default(false),
        id_eve_per: z.string(),
        requisitos: z.array(z.object({
            nom_req: z.string(),
            des_req: z.string(),
            tipo_req: z.string().default('DOCUMENTO'),
            obligatorio: z.boolean().default(true)
        })).optional()
    }),
    async handler(input) {
        try {
            const result = await prisma.$transaction(async (tx) => {
                // Crear la asignación
                const asignacion = await tx.asignaciones.create({
                    data: {
                        nom_asi: input.nom_asi,
                        des_asi: input.des_asi,
                        id_car_asi: input.id_car_asi || null,
                        es_publico_general: input.es_publico_general,
                        es_gratuito: input.es_gratuito,
                        requiere_validacion: input.requiere_validacion,
                        id_eve_per: input.id_eve_per
                    }
                });

                // Crear los requisitos si existen
                if (input.requisitos && input.requisitos.length > 0) {
                    await tx.requisitos.createMany({
                        data: input.requisitos.map(req => ({
                            ...req,
                            id_asi_per: asignacion.id_asi
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
            console.error('Error al crear asignación:', error);
            return {
                success: false,
                error: 'Error al crear la asignación'
            };
        }
    }
});

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

export const modificarAsignacion = defineAction({
    accept: 'json',
    input: z.object({
        id_asignacion: z.string(),
        nom_asi: z.string().min(1, 'El nombre es requerido'),
        des_asi: z.string().min(1, 'La descripción es requerida'),
        id_car_asi: z.string().nullable().optional(),
        es_publico_general: z.boolean().default(false),
        es_gratuito: z.boolean().default(false),
        requiere_validacion: z.boolean().default(false),
        requisitos: z.array(z.object({
            id_req: z.string().optional(),
            nom_req: z.string(),
            des_req: z.string(),
            tipo_req: z.string().default('DOCUMENTO'),
            obligatorio: z.boolean().default(true)
        })).optional()
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
                        id_car_asi: input.id_car_asi || null,
                        es_publico_general: input.es_publico_general,
                        es_gratuito: input.es_gratuito,
                        requiere_validacion: input.requiere_validacion
                    }
                });

                // Eliminar requisitos existentes
                await tx.requisitos.deleteMany({
                    where: { id_asi_per: input.id_asignacion }
                });

                // Crear nuevos requisitos
                if (input.requisitos && input.requisitos.length > 0) {
                    await tx.requisitos.createMany({
                        data: input.requisitos.map(req => ({
                            nom_req: req.nom_req,
                            des_req: req.des_req,
                            tipo_req: req.tipo_req,
                            obligatorio: req.obligatorio,
                            id_asi_per: input.id_asignacion
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

// === NUEVAS ACCIONES PARA CRUD INDEPENDIENTE DE ASIGNACIONES ===

export const getAllAsignaciones = defineAction({
    accept: 'json',
    input: z.object({}),
    async handler() {
        try {
            // Obtener todas las asignaciones, agrupando por características similares
            const asignaciones = await prisma.asignaciones.findMany({
                include: {
                    carreras: true,
                    requisitos: true
                },
                orderBy: {
                    nom_asi: 'asc'
                }
            });

            // Filtrar asignaciones únicas por nombre y características para evitar duplicados
            const asignacionesUnicas = asignaciones.reduce((acc: any[], current) => {
                const existe = acc.find(a =>
                    a.nom_asi === current.nom_asi &&
                    a.des_asi === current.des_asi &&
                    a.id_car_asi === current.id_car_asi &&
                    a.es_publico_general === current.es_publico_general &&
                    a.es_gratuito === current.es_gratuito &&
                    a.requiere_validacion === current.requiere_validacion
                );

                if (!existe) {
                    acc.push(current);
                }

                return acc;
            }, []);

            const asignacionesPlanas = JSON.parse(JSON.stringify(asignacionesUnicas));

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

export const crearAsignacionCompleta = defineAction({
    accept: 'json',
    input: z.object({
        nom_asi: z.string().min(1, 'El nombre es requerido'),
        des_asi: z.string().min(1, 'La descripción es requerida'),
        id_car_asi: z.string().nullable().optional(),
        es_publico_general: z.boolean().default(false),
        es_gratuito: z.boolean().default(false),
        requiere_validacion: z.boolean().default(false),
        requisitos: z.array(z.object({
            nom_req: z.string(),
            des_req: z.string(),
            tipo_req: z.string().default('DOCUMENTO'),
            obligatorio: z.boolean().default(true)
        })).optional()
    }),
    async handler(input) {
        try {
            const result = await prisma.$transaction(async (tx) => {
                // Crear una asignación "plantilla" con un evento temporal
                let eventoPlantilla = await tx.eventos.findFirst({
                    where: { nom_eve: 'PLANTILLA_ASIGNACIONES' }
                });

                // Si no existe el evento plantilla, lo creamos
                if (!eventoPlantilla) {
                    // Obtener la primera categoría y organizador disponible
                    const primeraCategoria = await tx.categorias_eventos.findFirst();
                    const primerOrganizador = await tx.organizadores.findFirst();

                    if (!primeraCategoria || !primerOrganizador) {
                        throw new Error('No se encontraron categorías o organizadores disponibles');
                    }

                    eventoPlantilla = await tx.eventos.create({
                        data: {
                            nom_eve: 'PLANTILLA_ASIGNACIONES',
                            des_eve: 'Evento temporal para almacenar plantillas de asignaciones',
                            fec_ini_eve: new Date(),
                            fec_fin_eve: new Date(),
                            hor_ini_eve: new Date('1970-01-01T00:00:00Z'),
                            hor_fin_eve: new Date('1970-01-01T23:59:59Z'),
                            ubi_eve: 'Virtual',
                            precio: 0,
                            id_cat_eve: primeraCategoria.id_cat,
                            ced_org_eve: primerOrganizador.ced_org
                        }
                    });
                }

                const asignacion = await tx.asignaciones.create({
                    data: {
                        nom_asi: input.nom_asi,
                        des_asi: input.des_asi,
                        id_car_asi: input.id_car_asi || null,
                        es_publico_general: input.es_publico_general,
                        es_gratuito: input.es_gratuito,
                        requiere_validacion: input.requiere_validacion,
                        id_eve_per: eventoPlantilla.id_eve
                    }
                });

                // Crear los requisitos si existen
                if (input.requisitos && input.requisitos.length > 0) {
                    await tx.requisitos.createMany({
                        data: input.requisitos.map(req => ({
                            nom_req: req.nom_req,
                            des_req: req.des_req,
                            tipo_req: req.tipo_req,
                            obligatorio: req.obligatorio,
                            id_asi_per: asignacion.id_asi
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

export const modificarAsignacionCompleta = defineAction({
    accept: 'json',
    input: z.object({
        id_asignacion: z.string(),
        nom_asi: z.string().min(1, 'El nombre es requerido'),
        des_asi: z.string().min(1, 'La descripción es requerida'),
        id_car_asi: z.string().nullable().optional(),
        es_publico_general: z.boolean().default(false),
        es_gratuito: z.boolean().default(false),
        requiere_validacion: z.boolean().default(false),
        requisitos: z.array(z.object({
            nom_req: z.string(),
            des_req: z.string(),
            tipo_req: z.string().default('DOCUMENTO'),
            obligatorio: z.boolean().default(true)
        })).optional()
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
                        id_car_asi: input.id_car_asi || null,
                        es_publico_general: input.es_publico_general,
                        es_gratuito: input.es_gratuito,
                        requiere_validacion: input.requiere_validacion
                    }
                });

                // Eliminar requisitos existentes
                await tx.requisitos.deleteMany({
                    where: { id_asi_per: input.id_asignacion }
                });

                // Crear nuevos requisitos
                if (input.requisitos && input.requisitos.length > 0) {
                    await tx.requisitos.createMany({
                        data: input.requisitos.map(req => ({
                            nom_req: req.nom_req,
                            des_req: req.des_req,
                            tipo_req: req.tipo_req,
                            obligatorio: req.obligatorio,
                            id_asi_per: input.id_asignacion
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

// Acción para eliminar asignación independiente
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

// Acción para obtener asignaciones plantilla (para usar en eventos)
export const getAsignacionesPlantilla = defineAction({
    accept: 'json',
    input: z.object({}),
    async handler() {
        try {
            // Buscar el evento plantilla
            const eventoPlantilla = await prisma.eventos.findFirst({
                where: { nom_eve: 'PLANTILLA_ASIGNACIONES' }
            });

            if (!eventoPlantilla) {
                return {
                    success: true,
                    asignaciones: []
                };
            }

            const asignaciones = await prisma.asignaciones.findMany({
                where: {
                    id_eve_per: eventoPlantilla.id_eve
                },
                include: {
                    carreras: true,
                    requisitos: true
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
            console.error('Error al obtener asignaciones plantilla:', error);
            return {
                success: false,
                error: 'Error al obtener las asignaciones plantilla'
            };
        }
    }
});

// Acción para duplicar una asignación plantilla a un evento específico
export const duplicarAsignacionAEvento = defineAction({
    accept: 'json',
    input: z.object({
        id_asignacion_plantilla: z.string(),
        id_evento_destino: z.string()
    }),
    async handler(input) {
        try {
            const result = await prisma.$transaction(async (tx) => {
                // Obtener la asignación plantilla
                const asignacionPlantilla = await tx.asignaciones.findUnique({
                    where: { id_asi: input.id_asignacion_plantilla },
                    include: { requisitos: true }
                });

                if (!asignacionPlantilla) {
                    throw new Error('Asignación plantilla no encontrada');
                }

                // Verificar si ya existe una asignación similar en el evento destino
                const asignacionExistente = await tx.asignaciones.findFirst({
                    where: {
                        id_eve_per: input.id_evento_destino,
                        nom_asi: asignacionPlantilla.nom_asi,
                        des_asi: asignacionPlantilla.des_asi,
                        id_car_asi: asignacionPlantilla.id_car_asi
                    }
                });

                if (asignacionExistente) {
                    return { duplicada: false, asignacion: asignacionExistente };
                }

                // Crear la nueva asignación en el evento destino
                const nuevaAsignacion = await tx.asignaciones.create({
                    data: {
                        nom_asi: asignacionPlantilla.nom_asi,
                        des_asi: asignacionPlantilla.des_asi,
                        id_car_asi: asignacionPlantilla.id_car_asi,
                        es_publico_general: asignacionPlantilla.es_publico_general,
                        es_gratuito: asignacionPlantilla.es_gratuito,
                        requiere_validacion: asignacionPlantilla.requiere_validacion,
                        id_eve_per: input.id_evento_destino
                    }
                });

                // Duplicar los requisitos
                if (asignacionPlantilla.requisitos.length > 0) {
                    await tx.requisitos.createMany({
                        data: asignacionPlantilla.requisitos.map(req => ({
                            nom_req: req.nom_req,
                            des_req: req.des_req,
                            tipo_req: req.tipo_req,
                            obligatorio: req.obligatorio,
                            id_asi_per: nuevaAsignacion.id_asi
                        }))
                    });
                }

                return { duplicada: true, asignacion: nuevaAsignacion };
            });

            return {
                success: true,
                duplicada: result.duplicada,
                asignacion: JSON.parse(JSON.stringify(result.asignacion))
            };
        } catch (error) {
            console.error('Error al duplicar asignación:', error);
            return {
                success: false,
                error: 'Error al duplicar la asignación'
            };
        }
    }
});