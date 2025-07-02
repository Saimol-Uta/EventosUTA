import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const getByIdInscripcion = defineAction({
    accept: 'json',
    input: z.object({
        id: z.string().min(1)
    }),
    async handler({ id }) {
        try {
            const inscripciones = await prisma.inscripciones.findMany({
                where: { id_eve_ins: id },
                // ✅ 'include' es más limpio que 'select' si quieres traer todo
                include: {
                    usuarios: {
                        include: {
                            carreras: {
                                include: {
                                    facultades: true
                                }
                            }
                        }
                    }, eventos: {
                        include: {
                            categorias_eventos: true,
                            organizadores: true,
                            asignaciones: {
                                include: {
                                    detalle_asignaciones: {
                                        include: {
                                            carreras: true,
                                        },
                                    },
                                },
                            },
                        }
                    },
                },
                orderBy: { fec_ins: 'desc' }
            });


            // Serializar fechas y decimales para evitar problemas de serialización
            const inscripcionesSerializadas = inscripciones.map(inscripcion => ({
                ...inscripcion,
                fec_ins: inscripcion.fec_ins?.toISOString(),
                not_par: inscripcion.not_par ? Number(inscripcion.not_par) : null,
                eventos: {
                    ...inscripcion.eventos,
                    fec_ini_eve: inscripcion.eventos.fec_ini_eve?.toISOString(),
                    fec_fin_eve: inscripcion.eventos.fec_fin_eve?.toISOString(),
                    precio: inscripcion.eventos.precio ? Number(inscripcion.eventos.precio) : null, // Serializar precio
                },
                usuarios: {
                    ...inscripcion.usuarios,
                    fec_nac_usu: inscripcion.usuarios.fec_nac_usu?.toISOString(),
                }
            }));

            return {
                success: true,
                inscripciones: inscripcionesSerializadas,
                total: inscripciones.length
            };

        } catch (error) {
            console.error('Error al obtener inscripciones:', error);
            return {
                success: false,
                error: 'Error al obtener las inscripciones del evento',
                inscripciones: [],
                total: 0
            };
        }
    },
});
