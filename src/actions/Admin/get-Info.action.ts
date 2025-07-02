import { defineAction } from 'astro:actions';
import {z} from 'astro:schema';
import prisma from '../../db';

export const getInfo = defineAction({
  accept: 'json',
  input: z.object({
    id_fac: z.string().uuid(), 
  }),
  handler: async ({ id_fac }) => {
    try {
      const info = await prisma.facultades.findUnique({
        where: {
          id_fac,
        },
      });

      if (!info) {
        throw new Error('Información no encontrada');
      }

      return {
        success: true,
        data: info,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  },
});
