import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const getUseById = defineAction({
    accept: 'json',
    input: z.string(),
    handler: async (idUser) => {
        const user = await prisma.usuarios.findUnique({
            where: {
                cor_cue: idUser,
            },
        });

        if (!user) {
            throw new Error("El usuario no existe");
        }

        return {
            user: user,
        };
    },
});