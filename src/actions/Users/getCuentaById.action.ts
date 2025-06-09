import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const getCuentaById = defineAction({
    accept: 'json',
    input: z.string(),
    handler: async (id_cuenta) => {
        // Acción
        const cuenta = await prisma.cuentas.findMany({
            where: { id_usu_per: id_cuenta },
            include: {
                usuarios: true
            }
        });
        return cuenta;
    },
});