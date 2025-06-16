import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const getCuentaByIdSingle = defineAction({
    accept: 'json',
    input: z.string(),
    handler: async (correo_usuario) => {
        // Obtener usuario por correo electrónico
        const usuario = await prisma.usuarios.findFirst({
            where: { cor_cue: correo_usuario },
            include: {
                carreras: true
            }
        });
        return usuario;
    },
});