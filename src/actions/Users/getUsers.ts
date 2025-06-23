import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const getUser = defineAction({
    accept: 'json',
    input: z.object({
        ced_usu: z.string().length(10, "La cédula debe tener exactamente 10 dígitos"),
    }),
    handler: async ({ ced_usu }) => {
        try {
            const usuario = await prisma.usuarios.findUnique({
                where: { ced_usu },
                select: {
                    cor_cue: true,        // Primary key
                    ced_usu: true,
                    nom_usu1: true,
                    nom_usu2: true,
                    ape_usu1: true,
                    ape_usu2: true,
                    fec_nac_usu: true,
                    num_tel_usu: true,
                    id_car_per: true,
                    rol_cue: true,
                    img_user: true,
                    enl_ced_cue: true,
                    enl_mat_cue: true,
                    carreras: {
                        select: {
                            id_car: true,
                            nom_car: true,
                            des_car: true,
                            cod_car: true,
                            facultades: {
                                select: {
                                    id_fac: true,
                                    nom_fac: true,
                                    des_fac: true
                                }
                            }
                        }
                    }
                }
            });

            if (!usuario) {
                return { encontrado: false };
            }

            return { encontrado: true, usuario };
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            return { encontrado: false, error: 'Error en la consulta' };
        }
    }
});

// Nueva acción para obtener todos los usuarios
export const getAllUsers = defineAction({
    accept: 'json',
    input: z.object({}).optional(),
    handler: async () => {
        try {
            const usuarios = await prisma.usuarios.findMany({
                select: {
                    cor_cue: true,        // Primary key
                    ced_usu: true,
                    nom_usu1: true,
                    nom_usu2: true,
                    ape_usu1: true,
                    ape_usu2: true,
                    fec_nac_usu: true,
                    num_tel_usu: true,
                    id_car_per: true,
                    rol_cue: true,
                    img_user: true,
                    enl_ced_cue: true,
                    enl_mat_cue: true,
                    carreras: {
                        select: {
                            id_car: true,
                            nom_car: true,
                            des_car: true,
                            cod_car: true,
                            facultades: {
                                select: {
                                    id_fac: true,
                                    nom_fac: true,
                                    des_fac: true
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            inscripciones: true,
                            cambios: true
                        }
                    }
                },
                orderBy: [
                    { nom_usu1: 'asc' },
                    { ape_usu1: 'asc' }
                ]
            });

            return {
                success: true,
                data: usuarios,
                total: usuarios.length
            };
        } catch (error) {
            console.error('Error al obtener todos los usuarios:', error);
            return {
                success: false,
                error: 'Error al obtener usuarios'
            };
        }
    }
});
