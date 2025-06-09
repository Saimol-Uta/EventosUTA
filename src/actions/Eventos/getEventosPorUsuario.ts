import { defineAction } from 'astro:actions';
import prisma from '@/db';
import { z } from 'astro:schema';

export const getEventosPorUsuario = defineAction({
  accept: 'json',

  input: z.object({
    idUsuario: z.string().uuid(),
  }),

  handler: async ({ idUsuario }) => {
    try {
      // Primero, obtenemos las inscripciones del usuario
      const inscripciones = await prisma.inscripciones.findMany({
        where: { id_usu_ins: idUsuario },
        select: {
          id_eve_ins: true,
          est_par: true,
          fec_ins: true,
        },
      });

      // Extraer los IDs de eventos únicos
      const idsEventos = [...new Set(inscripciones.map(i => i.id_eve_ins))];

      if (idsEventos.length === 0) {
        return {
          success: true,
          eventos: [],
        };
      }

      // Obtener los eventos por sus IDs
      const eventos = await prisma.eventos.findMany({
        where: {
          id_eve: {
            in: idsEventos,
          },
        },
      });

      // Unir eventos con la información de inscripción
      const eventosCombinados = eventos.map(evento => {
        const insc = inscripciones.find(i => i.id_eve_ins === evento.id_eve);
        return {
          ...evento,
          estado_inscripcion: insc?.est_par,
          fecha_inscripcion: insc?.fec_ins,
        };
      });

      return {
        success: true,
        eventos: eventosCombinados,
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
