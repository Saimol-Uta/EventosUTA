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
                    // TODOS los campos de inscripciones
                    id_ins: true,
                    id_usu_ins: true,
                    id_eve_ins: true,
                    fec_ins: true,
                    est_ins: true,
                    est_par: true,
                    not_par: true,
                    asi_par: true,
                    met_pag_ins: true,
                    enl_ord_pag_ins: true,
                    car_mot_inscrip: true, // Campo que faltaba
                    usuarios: {
                        select: {
                            cor_cue: true,
                            ced_usu: true,
                            nom_usu1: true,
                            nom_usu2: true,
                            ape_usu1: true,
                            ape_usu2: true,
                            fec_nac_usu: true,
                            num_tel_usu: true,
                            rol_cue: true,
                            enl_ced_cue: true,
                            enl_mat_cue: true,
                            carreras: {
                                select: {
                                    id_car: true,
                                    nom_car: true,
                                    cod_car: true,
                                    des_car: true,
                                    facultades: {
                                        select: {
                                            nom_fac: true,
                                            des_fac: true,
                                        }
                                    }
                                }
                            }
                        }
                    },
                    eventos: {
                        select: {
                            id_eve: true,
                            nom_eve: true,
                            fec_ini_eve: true,
                            fec_fin_eve: true,
                            des_eve: true,
                            img_eve: true,
                            precio: true, // Campo que faltaba
                            es_gratuito: true, // Campo que faltaba
                            requiere_carta: true, // Campo que faltaba
                            car_mot_eve: true, // Campo que faltaba
                            categorias_eventos: {
                                select: {
                                    nom_cat: true,
                                    des_cat: true,
                                }
                            },
                            organizadores: {
                                select: {
                                    nom_org1: true,
                                    nom_org2: true,
                                    ape_org1: true,
                                    ape_org2: true,
                                    tit_aca_org: true,
                                }
                            },
                            asignaciones: {
                                select: {
                                    id_asi: true,
                                    nom_asi: true,
                                    des_asi: true,
                                    tip_asi: true,
                                    detalle_asignaciones: {
                                        select: {
                                            carreras: {
                                                select: {
                                                    id_car: true,
                                                    nom_car: true,
                                                    cod_car: true,
                                                    des_car: true,
                                                    facultades: {
                                                        select: {
                                                            nom_fac: true,
                                                            des_fac: true
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    fec_ins: 'desc'
                }
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
