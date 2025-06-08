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
      // Extrae solo los eventos (sin duplicados)
      const eventosMap = new Map();
      inscripciones.forEach(i => {
        if (i.eventos && i.eventos.id_eve) {
          eventosMap.set(i.eventos.id_eve, {
            ...i.eventos,
            estado_inscripcion: i.est_par, // usa el campo correcto de estado
            fecha_inscripcion: i.fec_ins,
          });
        }
      });
      const eventos = Array.from(eventosMap.values());

      return {
        success: true,
        eventos,
      };
    } catch (error) {
      console.error("Error en getEventosPorUsuario:", error);
      return {
        success: false,
        error: 'Error al obtener eventos del usuario',
      };
    }
  },
});