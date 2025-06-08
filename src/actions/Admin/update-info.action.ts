import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const updatePaginaPrincipal = defineAction({
    input: z.object({
        des_pag: z.string().optional(),
        mis_pag: z.string().optional(),
        vis_pag: z.string().optional(),
    }),
    handler: async ({ des_pag, mis_pag, vis_pag }) => {
        try {
            // Crear objeto con solo los campos que se van a actualizar
            const updateData: any = {};

            if (des_pag !== undefined) updateData.des_pag = des_pag;
            if (mis_pag !== undefined) updateData.mis_pag = mis_pag;
            if (vis_pag !== undefined) updateData.vis_pag = vis_pag;

            const paginaPrincipal = await prisma.pagina_principal.upsert({
                where: {
                    id_pag: 1
                },
                update: updateData,
                create: {
                    id_pag: 1,
                    des_pag: des_pag || '',
                    mis_pag: mis_pag || '',
                    vis_pag: vis_pag || ''
                }
            });

            return {
                success: true,
                data: paginaPrincipal,
                message: 'Página principal actualizada correctamente'
            };
        } catch (error) {
            console.error('Error al actualizar página principal:', error);
            return {
                success: false,
                error: 'No se pudo actualizar la página principal.',
            };
        }
    },
});