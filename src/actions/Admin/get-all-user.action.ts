import { defineAction } from 'astro:actions';
import { z } from 'zod';
import prisma from '../../db';

export const getAllUsers = defineAction({
    accept: 'json',
    input: z.object({}), // Esquema vacío ya que no recibes parámetros
    handler: async () => {
        try {
            const users = await prisma.usuarios.findMany({
                orderBy: {
                    id_usu: 'asc'
                },
                include: {
                    cuentas: true, // Incluye la relación con las cuentas si es necesario
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