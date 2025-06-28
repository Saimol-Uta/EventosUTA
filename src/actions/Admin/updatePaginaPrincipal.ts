import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const updatePaginaPrincipal = defineAction({
  accept: 'form',
  input: z.object({
    nom_fac: z.string().optional(),
    des_fac: z.string().optional(),
    mis_fac: z.string().optional(),
    vis_fac: z.string().optional(),

    dec_fac: z.string().optional(),
    sub_fac: z.string().optional(),
    dec_img: z.string().optional(),
    sub_img: z.string().optional(), // Base64 o URL
  }),
  handler: async ({ nom_fac, des_fac, mis_fac, vis_fac, dec_fac, sub_fac, dec_img, sub_img }) => {
    try {
      const updateData: any = {};

      if (nom_fac !== undefined) updateData.nom_fac = nom_fac;
      if (des_fac !== undefined) updateData.des_fac = des_fac;
      if (mis_fac !== undefined) updateData.mis_fac = mis_fac;
      if (vis_fac !== undefined) updateData.vis_fac = vis_fac;

      if (dec_fac !== undefined) updateData.dec_fac = dec_fac;
      if (sub_fac !== undefined) updateData.sub_fac = sub_fac;
      if (dec_img !== undefined) updateData.dec_img = dec_img;
      if (sub_img !== undefined) updateData.sub_img = sub_img;

      const paginaPrincipal = await prisma.facultades.upsert({
        where: {
          id_fac: 'a1b2c3d4-e5f6-4a7b-8c9d-1a1a1a1a1a1a'
        },
        update: updateData,
        create: {
          id_fac: 'a1b2c3d4-e5f6-4a7b-8c9d-1a1a1a1a1a1a',
          nom_fac: nom_fac || '',
          des_fac: des_fac || '',
          mis_fac: mis_fac || '',
          vis_fac: vis_fac || '',
          dec_fac: dec_fac || '',
          dec_img: dec_img || '',
          sub_fac: sub_fac || '',
          sub_img: sub_img || '',
        }
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
