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
                    enl_cer_par: { not: null },
                    est_par: 'APROBADA',
                },
                include: {
                    eventos: {
                        select: {
                            nom_eve: true,
                            id_eve: true,
                            img_eve: true,
                        }
                    },
                },
                orderBy: { fec_cer_par: 'desc' }
            });

            // Serializar las fechas para evitar problemas de serialización
            const certificadosSerializados = inscripcionesConCertificado.map(inscripcion => ({
                ...inscripcion,
                fec_ins: inscripcion.fec_ins?.toISOString(),
                fec_cer_par: inscripcion.fec_cer_par?.toISOString(),
                not_par: inscripcion.not_par ? Number(inscripcion.not_par) : null,
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