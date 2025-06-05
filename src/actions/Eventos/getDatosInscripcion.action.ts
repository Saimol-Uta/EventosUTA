import { defineAction } from 'astro:actions';
import prisma from '../../db';
import { z } from 'astro:schema';

export const getDatosInscripcion = defineAction({
  accept: "json",
  input: z.object({
    idUsuario: z.string().uuid(),
    idEvento: z.string().uuid(),
  }),
  handler: async ({ idUsuario, idEvento }) => {
    const usuario = await prisma.usuarios.findUnique({
      where: { id_usu: idUsuario },
      include: {
        cuentas: true,
      },
    });

    const evento = await prisma.eventos.findUnique({
      where: { id_eve: idEvento },
      include: {
        categorias_eventos: true,
        eventos_asignaciones: {
          include: {
            asignaciones: {
              include: { requisitos: true },
            },
          },
        },
      },
    });

    const inscripcion = await prisma.inscripciones.findUnique({
      where: {
        id_usu_ins_id_eve_ins: {
          id_usu_ins: idUsuario,
          id_eve_ins: idEvento,
        },
      },
    });

    return {
      usuario,
      evento,
      inscripcion,
      requisitos: evento?.eventos_asignaciones[0]?.asignaciones?.requisitos ?? [],
    };
  },
});
