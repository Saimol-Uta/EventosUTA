import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const getCuentaByIdSingle = defineAction({
    accept: 'json',
    input: z.string(),
    handler: async (id_cuenta) => {
        // Acción
        const cuenta = await prisma.cuentas.findFirst({
            where: { id_cue: id_cuenta },
            include: {
                usuarios: true
            }
        });
        return cuenta;
    },
});