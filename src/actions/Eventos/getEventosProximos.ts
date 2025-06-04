import { defineAction } from 'astro:actions';
import prisma from '../../db';

export const getEventosProximos = defineAction({
  accept: 'json',

  handler: async () => {
    try {
      const eventos = await prisma.eventos.findMany({
        where: {
          fec_ini_eve: {
            gt: new Date(), // Fecha actual del servidor (equivalente a SYSDATE)
          },
        },
        orderBy: {
          fec_ini_eve: 'asc', // Opcional: para ordenarlos por fecha
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
        error: 'Error al obtener eventos próximos',
      };
    }
  },
});
