import { defineAction } from 'astro:actions';
import prisma from '../../db';
import { z } from 'astro:schema';

export const getEventosPorUsuario = defineAction({
  accept: 'json',

  input: z.object({
    idUsuario: z.string().uuid(), 
  }),

  handler: async ({ idUsuario }) => {
    try {
      const inscripciones = await prisma.inscripciones.findMany({
        where: { id_usu_ins: idUsuario },
        include: {
          eventos: true,
        },
      });

      const eventos = inscripciones.map(i => i.eventos);

      return {
        success: true,
        eventos,
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        error: 'Error al obtener eventos del usuario',
      };
    }
  },
});
