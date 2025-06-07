import { defineAction } from 'astro:actions';
import prisma from '../../db';
import { z } from 'astro:schema';

export const getCertificadosPorUsuario = defineAction({
  accept: 'json',

  input: z.object({
    idUsuario: z.string().uuid(),
  }),

  handler: async ({ idUsuario }) => {
    try {
      // Buscar inscripciones del usuario y obtener enlaces de certificados
      const certificados = await prisma.inscripciones.findMany({
        where: {
          id_usu_ins: idUsuario,
        },
        select: {
          enl_cer_par: true,
        },
      });

      // Extraer los enlaces como un arreglo plano
      const enlaces = certificados.map(c => c.enl_cer_par);

      return {
        success: true,
        enlaces,
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        error: 'Error al obtener certificados del usuario',
      };
    }
  },
});
