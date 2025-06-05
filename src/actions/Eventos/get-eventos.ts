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

// export const crearEvento = defineAction({
//     accept: 'json', input: z.object({
//         nombre: z.string().min(1),
//         descripcion: z.string().min(1),
//         categoria: z.string().uuid(), // Ahora esperamos un UUID de categoría
//         area: z.enum(['PRACTICA', 'INVESTIGACION', 'ACADEMICA', 'TECNICA', 'INDUSTRIAL', 'EMPRESARIAL', 'IA', 'REDES']).optional(),
//         precio: z.number().min(0),
//         fecha_inicio: z.string().transform(str => new Date(str)),
//         hora_inicio: z.string(),
//         fecha_fin: z.string().nullable().optional().transform(str => str ? new Date(str) : undefined),
//         hora_fin: z.string().nullable().optional(),
//         duracion: z.number().nullable().optional(),
//         ubicacion: z.string().min(1),
//         cedula_organizador: z.string().min(10).max(10),
//         imagen: z.string().optional(),
//     }),
//     async handler(input) {
//         try {
//             return await prisma.$transaction(async (tx) => {
//                 // 1. Verificar que el organizador existe
//                 const organizador = await tx.organizadores.findUnique({
//                     where: { ced_org: input.cedula_organizador }
//                 });

//                 if (!organizador) {
//                     return {
//                         success: false,
//                         error: 'El organizador no existe en el sistema'
//                     };
//                 }                // 2. Verificar que la categoría existe
//                 const categoria = await tx.categorias_eventos.findUnique({
//                     where: { id_cat: input.categoria }
//                 });

//                 if (!categoria) {
//                     return {
//                         success: false,
//                         error: 'La categoría especificada no existe'
//                     };
//                 }

//                 // 3. Crear el evento
//                 const nuevoEvento = await tx.eventos.create({
//                     data: {
//                         nom_eve: input.nombre,
//                         des_eve: input.descripcion,
//                         id_cat_eve: input.categoria, // Usar directamente el ID
//                         fec_ini_eve: input.fecha_inicio,
//                         fec_fin_eve: input.fecha_fin,
//                         hor_ini_eve: new Date(`1970-01-01T${input.hora_inicio}:00`),
//                         hor_fin_eve: input.hora_fin ? new Date(`1970-01-01T${input.hora_fin}:00`) : undefined,
//                         dur_eve: input.duracion,
//                         are_eve: input.area,
//                         ubi_eve: input.ubicacion,
//                         ced_org_eve: input.cedula_organizador,
//                         img_eve: input.imagen,
//                         precio: input.precio
//                     }
//                 });

//                 // Convertir a objeto plano
//                 const eventoSerializable = JSON.parse(JSON.stringify(nuevoEvento));

//                 return {
//                     success: true,
//                     message: 'Evento creado correctamente',
//                     evento: eventoSerializable
//                 };
//             });
//         } catch (error) {
//             console.error('Error al crear evento:', error);
//             return {
//                 success: false,
//                 error: 'Error al crear el evento'
//             };
//         }
//     }
// });

export const modificarEvento = defineAction({
    accept: 'json',
    input: z.object({
        evento_id: z.string().uuid(),
        nombre: z.string().min(1),
        descripcion: z.string().min(1), categoria: z.string().uuid(), // Ahora esperamos un UUID de categoría
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
        nota_aprobacion: z.number().min(0).max(10).optional(),
        tiempo_registro_asignacion: z.boolean().optional(),
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
                        ubi_eve: input.ubicacion, ced_org_eve: input.cedula_organizador,
                        img_eve: input.imagen,
                        precio: input.precio,
                        not_apr_eve: input.nota_aprobacion || 7.0,
                        tie_reg_asi: input.tiempo_registro_asignacion ?? true
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
                    eventos_asignaciones: {
                        some: {
                            id_eve: input.id_evento
                        }
                    }
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
    accept: 'json', input: z.object({
        nom_asi: z.string().min(1, 'El nombre es requerido'),
        des_asi: z.string().min(1, 'La descripción es requerida'),
        id_car_asi: z.string().nullable().optional(),
        es_publico_general: z.boolean().default(false),
        es_gratuito: z.boolean().default(false),
        requiere_validacion: z.boolean().default(false),
        id_evento: z.string(),
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
                    }
                });

                // Crear la relación evento-asignación
                await tx.eventos_asignaciones.create({
                    data: {
                        id_eve: input.id_evento,
                        id_asi: asignacion.id_asi
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
                const asignacion = await tx.asignaciones.create({
                    data: {
                        nom_asi: input.nom_asi,
                        des_asi: input.des_asi,
                        id_car_asi: input.id_car_asi || null,
                        es_publico_general: input.es_publico_general,
                        es_gratuito: input.es_gratuito,
                        requiere_validacion: input.requiere_validacion,
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
    input: z.object({}), async handler() {
        try {
            console.log('🚀 Iniciando getAsignacionesPlantilla...');

            // Buscar el evento plantilla
            let eventoPlantilla = await prisma.eventos.findFirst({
                where: { nom_eve: 'PLANTILLA_ASIGNACIONES' }
            });

            console.log('📋 Evento plantilla encontrado:', !!eventoPlantilla);
            if (eventoPlantilla) {
                console.log('🎯 ID del evento plantilla:', eventoPlantilla.id_eve);
            }

            // Si no existe el evento plantilla, intentar crearlo
            if (!eventoPlantilla) {
                console.log('⚡ Creando evento plantilla...');

                // Obtener el primer organizador y categoría disponibles
                const primerOrganizador = await prisma.organizadores.findFirst();
                const primeraCategoria = await prisma.categorias_eventos.findFirst();

                if (!primerOrganizador || !primeraCategoria) {
                    console.warn('⚠️ No hay organizadores o categorías disponibles para crear evento plantilla');
                    return {
                        success: true,
                        asignaciones: []
                    };
                }

                eventoPlantilla = await prisma.eventos.create({
                    data: {
                        nom_eve: 'PLANTILLA_ASIGNACIONES',
                        des_eve: 'Evento plantilla para asignaciones reutilizables',
                        fec_ini_eve: new Date('2024-01-01'),
                        fec_fin_eve: new Date('2024-01-01'),
                        hor_ini_eve: new Date('1970-01-01T00:00:00Z'),
                        hor_fin_eve: new Date('1970-01-01T23:59:59Z'),
                        ubi_eve: 'Virtual',
                        precio: 0,
                        id_cat_eve: primeraCategoria.id_cat,
                        ced_org_eve: primerOrganizador.ced_org
                    }
                });

                console.log('✅ Evento plantilla creado:', eventoPlantilla.id_eve);
            }

            // Buscar todas las asignaciones en el sistema (no solo las del evento plantilla)
            // Esto permite usar cualquier asignación existente como plantilla
            console.log('🔍 Buscando todas las asignaciones disponibles...');
            const asignaciones = await prisma.asignaciones.findMany({
                include: {
                    carreras: true,
                    requisitos: true
                },
                orderBy: {
                    nom_asi: 'asc'
                }
            });

            console.log('📊 Total de asignaciones encontradas:', asignaciones.length);

            // Log detallado de cada asignación
            asignaciones.forEach((asig, index) => {
                console.log(`📝 Asignación ${index + 1}: "${asig.nom_asi}" (ID: ${asig.id_asi})`);
            });

            const asignacionesPlanas = JSON.parse(JSON.stringify(asignaciones));

            console.log('🎉 Retornando', asignacionesPlanas.length, 'asignaciones');

            return {
                success: true,
                asignaciones: asignacionesPlanas
            };
        } catch (error) {
            console.error('💥 Error al obtener asignaciones plantilla:', error);
            return {
                success: false,
                error: 'Error al obtener las asignaciones plantilla'
            };
        }
    }
});

// Acción para vincular una asignación existente a un evento específico
export const vincularAsignacionAEvento = defineAction({
    accept: 'json',
    input: z.object({
        id_asignacion: z.string(),
        id_evento: z.string()
    }),
    async handler(input) {
        return await vincularAsignacionHelper(input.id_asignacion, input.id_evento);
    }
});

// Función auxiliar reutilizable para vincular asignaciones
async function vincularAsignacionHelper(id_asignacion: string, id_evento: string) {
    try {
        console.log('🔗 Vinculando asignación al evento...', { id_asignacion, id_evento });

        const result = await prisma.$transaction(async (tx) => {
            // Verificar que la asignación existe
            const asignacion = await tx.asignaciones.findUnique({
                where: { id_asi: id_asignacion }
            });

            if (!asignacion) {
                throw new Error('Asignación no encontrada');
            }

            // Verificar que el evento existe
            const evento = await tx.eventos.findUnique({
                where: { id_eve: id_evento }
            });

            if (!evento) {
                throw new Error('Evento no encontrado');
            }

            // Verificar si ya existe la relación
            const relacionExistente = await tx.eventos_asignaciones.findFirst({
                where: {
                    id_eve: id_evento,
                    id_asi: id_asignacion
                }
            });

            if (relacionExistente) {
                console.log('⚠️ La relación ya existe, saltando creación');
                return { yaExistia: true, relacion: relacionExistente };
            }

            // Crear la relación evento-asignación
            const nuevaRelacion = await tx.eventos_asignaciones.create({
                data: {
                    id_eve: id_evento,
                    id_asi: id_asignacion
                }
            });

            console.log('✅ Relación creada exitosamente');
            return { yaExistia: false, relacion: nuevaRelacion };
        });

        return {
            success: true,
            yaExistia: result.yaExistia,
            relacion: JSON.parse(JSON.stringify(result.relacion))
        };
    } catch (error) {
        console.error('💥 Error al vincular asignación:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error al vincular la asignación'
        };
    }
}

// Ahora corregimos duplicarAsignacionAEvento para usar solo vinculación
export const duplicarAsignacionAEvento = defineAction({
    accept: 'json',
    input: z.object({
        id_asignacion_plantilla: z.string(),
        id_evento_destino: z.string()
    }),
    async handler(input) {
        console.log('🔗 Vinculando asignación existente al evento (sin duplicar)...');

        // Usar la función auxiliar para vincular
        const result = await vincularAsignacionHelper(
            input.id_asignacion_plantilla,
            input.id_evento_destino
        );

        if (!result.success) {
            return { success: false, error: result.error };
        }

        return {
            success: true,
            duplicada: !result.yaExistia,
            asignacion: { id_asi: input.id_asignacion_plantilla }
        };
    }
});

// Función temporal para crear asignaciones de prueba
export const crearAsignacionesPrueba = defineAction({
    accept: 'json',
    input: z.object({}),
    async handler() {
        try {
            // Obtener una carrera existente
            const primerCarrera = await prisma.carreras.findFirst();

            // Crear asignaciones de prueba
            const asignacionesPrueba = [
                {
                    nom_asi: 'Estudiantes de Pregrado',
                    des_asi: 'Asignación para estudiantes de pregrado de todas las carreras',
                    id_car_asi: null,
                    es_publico_general: false,
                    es_gratuito: true,
                    requiere_validacion: false
                },
                {
                    nom_asi: 'Profesionales TI',
                    des_asi: 'Asignación para profesionales del área de tecnología',
                    id_car_asi: primerCarrera?.id_car || null,
                    es_publico_general: true,
                    es_gratuito: false,
                    requiere_validacion: true
                },
                {
                    nom_asi: 'Docentes Universitarios',
                    des_asi: 'Asignación específica para docentes universitarios',
                    id_car_asi: null,
                    es_publico_general: true,
                    es_gratuito: true,
                    requiere_validacion: true
                }
            ];

            const asignacionesCreadas = [];

            for (const datosAsignacion of asignacionesPrueba) {
                // Verificar si ya existe
                const existe = await prisma.asignaciones.findFirst({
                    where: { nom_asi: datosAsignacion.nom_asi }
                });

                if (!existe) {
                    const nuevaAsignacion = await prisma.asignaciones.create({
                        data: datosAsignacion,
                        include: {
                            carreras: true,
                            requisitos: true
                        }
                    });
                    asignacionesCreadas.push(nuevaAsignacion);
                }
            }

            return {
                success: true,
                mensaje: `Se crearon ${asignacionesCreadas.length} asignaciones de prueba`,
                asignaciones: JSON.parse(JSON.stringify(asignacionesCreadas))
            };
        } catch (error) {
            console.error('Error al crear asignaciones de prueba:', error);
            return {
                success: false,
                error: 'Error al crear asignaciones de prueba'
            };
        }
    }
});