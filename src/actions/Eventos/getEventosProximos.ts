import { defineAction } from 'astro:actions';
import prisma from '../../db';

export const getEventosProximos = defineAction({
  handler: async () => {
    try {
      const eventos = await prisma.eventos.findMany({
        where: {
          fec_ini_eve: {
            gt: new Date(), // Fecha actual del servidor
          },
        },
        orderBy: {
          fec_ini_eve: 'asc',
        },
        select: {
          nom_eve: true,        
          fec_ini_eve: true,    
        },
      });

      return {
        success: true,
        eventos,
      };
    } catch (error) {
      console.error('Error al obtener eventos próximos:', error);
      return {
        success: false,
        error: 'No se pudieron obtener los eventos próximos.',
      };
    }
  },
});
