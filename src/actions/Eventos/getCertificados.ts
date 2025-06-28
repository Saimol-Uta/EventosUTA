import { defineAction } from 'astro:actions';
import prisma from '../../db';
import { z } from 'astro:schema';

export const getCertificadosPorUsuario = defineAction({
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
                    error: { message: 'Usuario no encontrado.' },
                };
            }

            const inscripcionesConCertificado = await prisma.inscripciones.findMany({
                where: {
                    id_usu_ins: idUsuario,
                    est_par: 'APROBADA',
                    OR: [
                        { enl_cer_par: { not: null } }, // Certificados ya generados
                        { 
                            // Solo eventos que brindan certificado y están aprobados
                            eventos: {
                                categorias_eventos: {
                                    brinda_certificado: true
                                }
                            }
                        }
                    ]
                },
                include: {
                    eventos: {
                        select: {
                            nom_eve: true,
                            id_eve: true,
                            img_eve: true,
                            fec_fin_eve: true,
                            categorias_eventos: {
                                select: {
                                    requiere_asistencia: true,
                                    requiere_puntaje: true,
                                    brinda_certificado: true,
                                    asi_cat: true, // Asistencia mínima de la categoría
                                    pun_apr_cat: true, // Puntaje mínimo de la categoría
                                }
                            }
                        }
                    },
                },
                orderBy: { fec_cer_par: 'desc' }
            });

            // Filtrar solo eventos que ya hayan finalizado y cumplan requisitos
            const fechaActual = new Date();
            const certificadosDisponibles = inscripcionesConCertificado.filter(inscripcion => {
                const eventoFinalizado = inscripcion.eventos.fec_fin_eve && 
                                        inscripcion.eventos.fec_fin_eve < fechaActual;
                
                if (!eventoFinalizado) return false;

                const categoria = inscripcion.eventos.categorias_eventos;
                const brindaCertificado = categoria?.brinda_certificado ?? false;
                
                // Si la categoría no brinda certificado, no está disponible
                if (!brindaCertificado) return false;

                const requiereAsistencia = categoria?.requiere_asistencia ?? false;
                const requierePuntaje = categoria?.requiere_puntaje ?? false;
                const asistencia = inscripcion.asi_par ?? 0;
                const calificacion = inscripcion.not_par ? Number(inscripcion.not_par) : 0;
                
                // Obtener los valores específicos de la categoría
                const asistenciaMinimaRequerida = categoria?.asi_cat ?? 70;
                const puntajeMinimoRequerido = categoria?.pun_apr_cat ? Number(categoria.pun_apr_cat) : 7.0;

                // Si no requiere asistencia ni puntaje, está disponible (solo necesita haber finalizado)
                if (!requiereAsistencia && !requierePuntaje) {
                    return true;
                }

                // Si requiere asistencia y/o puntaje, verificar que cumple con los valores de la categoría
                const cumpleAsistencia = !requiereAsistencia || asistencia >= asistenciaMinimaRequerida;
                const cumplePuntaje = !requierePuntaje || calificacion >= puntajeMinimoRequerido;
                
                return cumpleAsistencia && cumplePuntaje;
            });

            // Serializar las fechas para evitar problemas de serialización
            const certificadosSerializados = certificadosDisponibles.map(inscripcion => ({
                ...inscripcion,
                fec_ins: inscripcion.fec_ins?.toISOString(),
                fec_cer_par: inscripcion.fec_cer_par?.toISOString(),
                not_par: inscripcion.not_par ? Number(inscripcion.not_par) : null,
                eventos: {
                    ...inscripcion.eventos,
                    fec_fin_eve: inscripcion.eventos.fec_fin_eve?.toISOString(),
                }
            }));

            return {
                success: true,
                certificados: certificadosSerializados,
            };
        } catch (error) {
            console.error('Error al obtener certificados:', error);
            return {
                success: false,
                error: { message: 'No se pudieron obtener los certificados del usuario.' },
            };
        }
    },
});