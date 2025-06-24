import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const updatePaginaPrincipal = defineAction({
  accept: 'form',
  input: z.object({
    des_pag: z.string().optional(),
    mis_pag: z.string().optional(),
    vis_pag: z.string().optional(),

    // Nuevos campos para la tarjeta del decano
    dec_fac: z.string().optional(),
    sub_fac: z.string().optional(),
    sub_fac2: z.string().optional(),
    sub_img: z.string().optional(), // Base64 o URL
  }),
  handler: async ({ des_pag, mis_pag, vis_pag, dec_fac, sub_fac, sub_fac2, sub_img }) => {
    try {
      const updateData: any = {};

      if (des_pag !== undefined) updateData.des_pag = des_pag;
      if (mis_pag !== undefined) updateData.mis_pag = mis_pag;
      if (vis_pag !== undefined) updateData.vis_pag = vis_pag;

      if (dec_fac !== undefined) updateData.dec_fac = dec_fac;
      if (sub_fac !== undefined) updateData.sub_fac = sub_fac;
      if (sub_fac2 !== undefined) updateData.sub_fac2 = sub_fac2;
      if (sub_img !== undefined) updateData.sub_img = sub_img;

      const paginaPrincipal = await prisma.pagina_principal.upsert({
        where: {
          id_pag: 1
        },
        update: updateData,
        create: {
          id_pag: 1,
          des_pag: des_pag || '',
          mis_pag: mis_pag || '',
          vis_pag: vis_pag || '',

          dec_fac: dec_fac || '',
          sub_fac: sub_fac || '',
          sub_fac2: sub_fac2 || '',
          sub_img: sub_img || '',
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
