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
    
      const certificados = await prisma.inscripciones.findMany({
        where: {
          id_usu_ins: idUsuario,
          enl_cer_par: {
            not: null, 
          },
        },
        select: {
          enl_cer_par: true,
        },
      });

   
      const enlaces = Array.from(
        new Set(
          certificados
            .map(c => c.enl_cer_par?.trim())
            .filter(Boolean) 
        )
      );

      return {
        success: true,
        enlaces,
      };
    } catch (error) {
      console.error('Error al obtener certificados:', error);
      return {
        success: false,
        error: 'No se pudieron obtener los certificados del usuario.',
      };
    }
  },
});
