import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const updatePaginaPrincipal = defineAction({
  accept: 'form',
  input: z.object({
    id_fac: z.string().uuid(), // Asegura que sea un UUID válido
    des_pag: z.string().optional(),
    mis_pag: z.string().optional(),
    vis_pag: z.string().optional(),
  }),
  handler: async ({ id_fac, des_pag, mis_pag, vis_pag }) => {
    try {
      // Solo incluir los campos que se desean actualizar
      const updateData: any = {};
      if (des_pag !== undefined) updateData.des_fac = des_pag;
      if (mis_pag !== undefined) updateData.mis_fac = mis_pag;
      if (vis_pag !== undefined) updateData.vis_fac = vis_pag;

      const paginaPrincipal = await prisma.facultades.upsert({
        where: {
          id_fac,
        },
        update: updateData,
        create: {
          id_fac,
          des_fac: des_pag || '',
          mis_fac: mis_pag || '',
          vis_fac: vis_pag || '',
        },
      });

      return {
        success: true,
        data: paginaPrincipal,
        message: 'Página principal actualizada correctamente',
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
