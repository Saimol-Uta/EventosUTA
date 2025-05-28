import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const getUseById = defineAction({
    accept: 'json',
    input: z.string(),
    handler: async (idUser) => {
        const user = await prisma.cuentas.findUnique({
            where: {
                id_cue: idUser,
            },
        });

        if (!user) {
            throw new Error("El vehículo no existe");
        }

        return {
            user: user,
        };
    },
});