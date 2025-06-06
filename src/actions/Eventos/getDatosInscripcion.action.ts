import { defineAction } from 'astro:actions';
import prisma from '../../db';
import { z } from 'astro:schema';

export const getDatosInscripcion = defineAction({
  accept: "json",
  input: z.object({
    idUsuario: z.string().uuid(), // Este es el id_cue (cuenta)
    idEvento: z.string().uuid(),
  }),
  handler: async ({ idUsuario, idEvento }) => {
    console.log("ID USUARIO (cuenta):", idUsuario);

    // Buscar la cuenta y su usuario relacionado
    const cuenta = await prisma.cuentas.findUnique({
      where: { id_cue: idUsuario },
      include: {
        usuarios: {
          include: {
            cuentas: true, // Incluye la(s) cuenta(s) asociada(s) al usuario
          }
        }
      },
    });

    const usuario = cuenta?.usuarios ?? null;
    console.log("USUARIO ENCONTRADO:", usuario);

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

    // Si usuario existe, buscar inscripción previa (por si acaso)
    const inscripcion = usuario
      ? await prisma.inscripciones.findUnique({
          where: {
            id_usu_ins_id_eve_ins: {
              id_usu_ins: usuario.id_usu,
              id_eve_ins: idEvento,
            },
          },
        })
      : null;

    // Unir todos los requisitos de todas las asignaciones del evento
    const requisitos = evento?.eventos_asignaciones
      .flatMap(ea => ea.asignaciones?.requisitos ?? []) ?? [];

    return {
      data: {
        usuario,
        evento,
        inscripcion,
        requisitos,
      }
    };
  },
});
