import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const getInscripcionesByUser = defineAction({
    accept: 'json',
    input: z.object({
        userId: z.string().min(1, 'ID de usuario requerido'), // cor_cue
    }),
    handler: async (input) => {
        try {
            // Verificar que el usuario existe
            const usuario = await prisma.usuarios.findUnique({
                where: { cor_cue: input.userId }
            });

            if (!usuario) {
                return {
                    success: false,
                    message: 'Usuario no encontrado',
                    data: []
                };
            }

            // Obtener inscripciones del usuario
            const inscripciones = await prisma.inscripciones.findMany({
                where: {
                    id_usu_ins: input.userId
                },
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
                            },
                            organizadores: {
                                select: {
                                    nom_org1: true,
                                    nom_org2: true,
                                    ape_org1: true,
                                    ape_org2: true,
                                    tit_aca_org: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    fec_ins: 'desc'
                }
            });

            return {
                success: true,
                data: inscripciones,
                total: inscripciones.length,
                message: `Se encontraron ${inscripciones.length} inscripciones para el usuario`
            };

        } catch (error) {
            console.error('Error al obtener inscripciones del usuario:', error);
            return {
                success: false,
                message: 'Error interno del servidor al obtener inscripciones',
                data: []
            };
        }
    }
});
