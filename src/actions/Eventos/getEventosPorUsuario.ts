import { defineAction } from 'astro:actions';
import prisma from '@/db';
import { z } from 'astro:schema';

export const getEventosPorUsuario = defineAction({
    accept: 'json',

    input: z.object({
        idUsuario: z.string(), // Cambiado para aceptar el correo del usuario
    }),

    handler: async ({ idUsuario }) => {
        try {
            // Verificar que el usuario existe
            const usuario = await prisma.usuarios.findUnique({
                where: { cor_cue: idUsuario },
                select: { cor_cue: true },
            });

            if (!usuario) {
                return {
                    success: false,
                    error: 'Usuario no encontrado',
                };
            }

            // Obtener las inscripciones del usuario con información completa del evento
            const inscripciones = await prisma.inscripciones.findMany({
                where: { id_usu_ins: idUsuario },
                include: {
                    eventos: {
                        include: {
                            categorias_eventos: {
                                select: {
                                    id_cat: true,
                                    nom_cat: true,
                                    des_cat: true,
                                    requiere_puntaje: true,
                                    requiere_asistencia: true,
                                    brinda_certificado: true,
                                },
                            },
                            organizadores: {
                                select: {
                                    ced_org: true,
                                    nom_org1: true,
                                    nom_org2: true,
                                    ape_org1: true,
                                    ape_org2: true,
                                    tit_aca_org: true,
                                },
                            },
                            asignaciones: {
                                select: {
                                    id_asi: true,
                                    nom_asi: true,
                                    des_asi: true,
                                    tip_asi: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    fec_ins: 'desc',
                },
            });

            // Mapear los resultados para incluir la información de inscripción
            const eventosCombinados = inscripciones.map(inscripcion => {
                // Serializar fechas para evitar problemas de serialización
                const evento = {
                    ...inscripcion.eventos,
                    fec_ini_eve: inscripcion.eventos.fec_ini_eve?.toISOString(),
                    fec_fin_eve: inscripcion.eventos.fec_fin_eve?.toISOString(),
                    fec_ini_ins_eve: inscripcion.eventos.fec_ini_ins_eve?.toISOString(),
                    fec_fin_ins_eve: inscripcion.eventos.fec_fin_ins_eve?.toISOString(),
                    precio: inscripcion.eventos.precio ? Number(inscripcion.eventos.precio) : 0,
                };

                return {
                    ...evento,
                    // Información de la inscripción
                    estado_inscripcion: inscripcion.est_par,
                    estado_inscripcion_evento: inscripcion.est_ins,
                    fecha_inscripcion: inscripcion.fec_ins?.toISOString(),
                    metodo_pago: inscripcion.met_pag_ins,
                    asistencia: inscripcion.asi_par,
                    nota: inscripcion.not_par ? Number(inscripcion.not_par) : null,
                    enlace_certificado: inscripcion.enl_cer_par,
                    fecha_certificado: inscripcion.fec_cer_par?.toISOString(),
                    codigo_certificado: inscripcion.cod_cer,
                    enlace_orden_pago: inscripcion.enl_ord_pag_ins,
                    // ID de inscripción para futuras operaciones
                    id_inscripcion: inscripcion.id_ins,
                };
            });

            return {
                success: true,
                eventos: eventosCombinados,
            };
        } catch (error) {
            console.error("Error en getEventosPorUsuario:", error);
            return {
                success: false,
                error: 'Error al obtener eventos del usuario',
            };
        }
    },
});
