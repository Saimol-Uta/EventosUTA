import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const getEventoBySlug = defineAction({
  accept: 'json',
  input: z.string(),
  handler: async (slug) => {
    const evento = await prisma.eventos.findUnique({
      where: { id_eve: slug },
      include: {
        categorias_eventos: true,
        organizadores: true,
        eventos_asignaciones: {
          include: {
            asignaciones: {
              include: {
                requisitos: true,
              },
            },
          },
        },
      },
    });

    if (!evento) {
      throw new Error('Evento no encontrado');
    }

    // Extraer todas las asignaciones con requisitos
    const asignaciones = evento.eventos_asignaciones.map(ea => ea.asignaciones);

    // Aplanar todos los requisitos de todas las asignaciones
    const requisitos = asignaciones.flatMap(asi => asi.requisitos);

    return {
      evento,
      categorias: evento.categorias_eventos,
      organizador: evento.organizadores,
      asignaciones,
      requisitos,
    };
  },
});
