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
                where: {
                    id_eve_ins: id
                },
                select: {
                    id_ins: true,
                    id_usu_ins: true,
                    id_eve_ins: true,
                    fec_ins: true,
                    est_ins: true,
                    est_par: true,
                    not_par: true,
                    asi_par: true,
                    met_pag_ins: true,
                    enl_ord_pag_ins: true, // Campo de enlace del comprobante de pago
                    usuarios: {
                        select: {
                            id_usu: true,
                            nom_usu1: true,
                            nom_usu2: true,
                            ape_usu1: true,
                            ape_usu2: true,
                            ced_usu: true,
                            fec_nac_usu: true,
                            num_tel_usu: true,
                            cuentas: {
                                select: {
                                    cor_cue: true,
                                    enl_ced_cue: true, // Enlace cédula
                                    enl_mat_cue: true, // Enlace certificado matrícula
                                    enl_ext_cue: true  // Enlace documento externo/carta motivación
                                }
                            },
                            carreras: {
                                select: {
                                    nom_car: true,
                                    cod_car: true
                                }
                            }
                        }
                    },
                    eventos: {
                        select: {
                            id_eve: true,
                            nom_eve: true,
                            fec_ini_eve: true,
                            fec_fin_eve: true
                        }
                    }
                },
                orderBy: {
                    fec_ins: 'desc'
                }
            });

            // Convertir a objetos planos
            const inscripcionesPlanas = JSON.parse(JSON.stringify(inscripciones));

            return {
                success: true,
                inscripciones: inscripcionesPlanas,
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