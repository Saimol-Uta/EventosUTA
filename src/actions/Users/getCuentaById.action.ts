import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const getCuentaById = defineAction({
    accept: 'json',
    input: z.string(),
    handler: async (correo_usuario) => {
        // Obtener usuario por correo (que es la clave primaria)
        const usuario = await prisma.usuarios.findUnique({
            where: { cor_cue: correo_usuario },
            include: {
                carreras: true
            }
        });
        return usuario;
    },
});