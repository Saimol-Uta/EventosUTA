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
                include: {
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