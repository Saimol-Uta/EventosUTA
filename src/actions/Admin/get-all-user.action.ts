import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const getAllUsers = defineAction({
    accept: 'json',
    handler: async () => {
        try {
            const users = await prisma.usuarios.findMany({
                // Puedes agregar filtros, ordenamiento, etc. según tus necesidades
                orderBy: {
                    id_usu: 'asc'
                }
            });

            return {
                success: true,
                data: users
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    },
});