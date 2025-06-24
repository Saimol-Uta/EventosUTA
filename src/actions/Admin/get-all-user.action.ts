import { defineAction } from 'astro:actions';
import prisma from '@/db';
import { z } from 'astro:schema';

export const getAllUsers = defineAction({
    accept: 'json',
    input: z.object({}).optional(), // Esquema vacío ya que no recibes parámetros
    handler: async () => {
        try {
            const users = await prisma.usuarios.findMany({
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
                data: users,
                total: users.length,
                message: `Se encontraron ${users.length} usuarios`
            };
        } catch (error) {
            console.error('Error al obtener todos los usuarios:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido al obtener usuarios',
                data: []
            };
        }
    },
});