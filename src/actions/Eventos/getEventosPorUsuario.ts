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
        select: { id_eve_ins: true },
      });

      const idsEventos = inscripciones.map(i => i.id_eve_ins);

      // Buscar eventos con esos IDs
      const eventos = await prisma.eventos.findMany({
        where: {
          id_eve: {
            in: idsEventos,
          },
        },
      });

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