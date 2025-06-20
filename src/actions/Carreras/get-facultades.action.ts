import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const getAllFacultades = defineAction({
    accept: 'json',
    input: z.object({}),
    async handler() {
        try {
            const facultades = await prisma.facultades.findMany({
                select: {
                    id_fac: true,
                    nom_fac: true,
                    des_fac: true,
                    dir_fac: true,
                    cor_fac: true,
                    dec_fac: true,
                    sub_fac: true
                },
                orderBy: {
                    nom_fac: 'asc'
                }
            });

            // Convertir a objetos planos para serialización
            const facultadesSerializables = facultades.map(facultad => ({
                id_fac: facultad.id_fac,
                nom_fac: facultad.nom_fac,
                des_fac: facultad.des_fac,
                dir_fac: facultad.dir_fac,
                cor_fac: facultad.cor_fac,
                dec_fac: facultad.dec_fac,
                sub_fac: facultad.sub_fac
            }));

            return {
                success: true,
                facultades: facultadesSerializables
            };
        } catch (error) {
            console.error('Error al obtener facultades:', error);
            return {
                success: false,
                error: 'Error al obtener las facultades'
            };
        }
    }
});
