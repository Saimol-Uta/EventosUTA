import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const getUsersWithAccounts = defineAction({
    accept: 'json',
    input: z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        search: z.string().optional(),
    }),
    handler: async (input) => {
        try {
            const skip = (input.page - 1) * input.limit;            // Construir filtros de búsqueda
            const where = input.search ? {
                OR: [
                    { ced_usu: { contains: input.search, mode: 'insensitive' as const } },
                    { nom_usu1: { contains: input.search, mode: 'insensitive' as const } },
                    { ape_usu1: { contains: input.search, mode: 'insensitive' as const } },
                    { cor_cue: { contains: input.search, mode: 'insensitive' as const } }
                ]
            } : {};

            // Obtener usuarios directamente (ya contienen toda la información)
            const usuarios = await prisma.usuarios.findMany({
                where,
                select: {
                    cor_cue: true,
                    ced_usu: true,
                    nom_usu1: true,
                    nom_usu2: true,
                    ape_usu1: true,
                    ape_usu2: true,
                    rol_cue: true,
                    fec_nac_usu: true,
                    num_tel_usu: true,
                    img_user: true,
                    carreras: {
                        select: {
                            id_car: true,
                            nom_car: true,
                            cod_car: true,
                        }
                    }
                },
                skip,
                take: input.limit,
                orderBy: {
                    nom_usu1: 'asc'
                }
            });

            // Contar total de usuarios para paginación
            const total = await prisma.usuarios.count({ where });

            return {
                success: true,
                data: {
                    usuarios,
                    pagination: {
                        page: input.page,
                        limit: input.limit,
                        total,
                        totalPages: Math.ceil(total / input.limit),
                    }
                }
            };
        } catch (error) {
            console.error("Error al obtener usuarios:", error);
            return {
                success: false,
                message: "Error interno del servidor al obtener usuarios",
            };
        }
    },
});
