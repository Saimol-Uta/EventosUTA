import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const getPerfilCompleto = defineAction({
    accept: 'json',
    input: z.object({
        userId: z.string().min(1, 'ID de usuario requerido'), // cor_cue
    }),
    handler: async (input) => {
        try {
            // Obtener perfil completo del usuario
            const usuario = await prisma.usuarios.findUnique({
                where: { cor_cue: input.userId },
                include: {
                    carreras: {
                        include: {
                            facultades: {
                                select: {
                                    id_fac: true,
                                    nom_fac: true,
                                    des_fac: true,
                                    mis_fac: true,
                                    vis_fac: true,
                                    dir_fac: true,
                                    cor_fac: true,
                                    dec_fac: true,
                                    sub_fac: true,
                                    twit_fac: true,
                                    face_fac: true,
                                    inst_fac: true
                                }
                            }
                        }
                    },
                    inscripciones: {
                        include: {
                            eventos: {
                                select: {
                                    id_eve: true,
                                    nom_eve: true,
                                    des_eve: true,
                                    fec_ini_eve: true,
                                    fec_fin_eve: true,
                                    img_eve: true,
                                    precio: true,
                                    es_gratuito: true,
                                    categorias_eventos: {
                                        select: {
                                            nom_cat: true,
                                            des_cat: true,
                                            brinda_certificado: true
                                        }
                                    }
                                }
                            }
                        },
                        orderBy: {
                            fec_ins: 'desc'
                        }
                    },
                    cambios: {
                        select: {
                            num_cam: true,
                            fec_cam: true,
                            rol_sol_cam: true,
                            des_cam: true,
                            mot_cam: true,
                            pri_cam: true,
                            tip_cam: true,
                            ori_cam: true,
                            est_cam: true
                        },
                        orderBy: {
                            fec_cam: 'desc'
                        }
                    }
                }
            });

            if (!usuario) {
                return {
                    success: false,
                    message: 'Usuario no encontrado'
                };
            }

            // Calcular estadísticas
            const estadisticas = {
                totalInscripciones: usuario.inscripciones.length,
                inscripcionesAprobadas: usuario.inscripciones.filter(i => i.est_ins === 'Aprobado').length,
                inscripcionesPendientes: usuario.inscripciones.filter(i => i.est_ins === 'DPendiente').length,
                inscripcionesRechazadas: usuario.inscripciones.filter(i => i.est_ins === 'Rechazado').length,
                totalSolicitudes: usuario.cambios.length,
                solicitudesPendientes: usuario.cambios.filter(c => c.est_cam === 'PENDIENTE').length,
                solicitudesAprobadas: usuario.cambios.filter(c => c.est_cam === 'APROBADO').length,
                solicitudesRechazadas: usuario.cambios.filter(c => c.est_cam === 'RECHAZADO').length,
                certificadosObtenidos: usuario.inscripciones.filter(i =>
                    i.est_par === 'APROBADO' && i.enl_cer_par
                ).length,
                // Calcular edad
                edad: usuario.fec_nac_usu ?
                    Math.floor((Date.now() - new Date(usuario.fec_nac_usu).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                    : null
            };

            return {
                success: true,
                data: {
                    usuario,
                    estadisticas
                },
                message: 'Perfil obtenido correctamente'
            };

        } catch (error) {
            console.error('Error al obtener perfil completo:', error);
            return {
                success: false,
                message: 'Error interno del servidor al obtener el perfil'
            };
        }
    }
});
