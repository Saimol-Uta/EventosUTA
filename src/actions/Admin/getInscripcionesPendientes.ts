import { defineAction } from 'astro:actions';
import prisma from '../../db';

export const getInscripcionesPendientes = defineAction({
  handler: async () => {
    try {
      const inscripciones = await prisma.inscripciones.findMany({
        where: {
          est_ins: {
            in: ['DPendiente', 'FPendiente'],
          },
        },
        orderBy: {
          fec_ins: 'desc', 
        },
      });

      return {
        success: true,
        inscripciones,
      };
    } catch (error) {
      console.error('Error al obtener inscripciones pendientes:', error);
      return {
        success: false,
        error: 'No se pudieron obtener las inscripciones pendientes.',
      };
    }
  },
});
