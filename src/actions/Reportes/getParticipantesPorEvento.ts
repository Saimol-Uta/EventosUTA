import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import prisma from "../../db"; // asegúrate de tener tu instancia configurada aquí

export const getParticipantesPorEvento = defineAction({
  accept: "json",
  input: z.string(), // id del evento
  handler: async (idEvento) => {
    const inscripciones = await prisma.inscripciones.findMany({
      where: { id_eve_ins: idEvento },
      include: {
        usuarios: true
      }
    });

    const participantes = inscripciones.map((inscripcion) => ({
      nombre: `${inscripcion.usuarios.nom_usu1} ${inscripcion.usuarios.nom_usu2 ?? ''} ${inscripcion.usuarios.ape_usu1} ${inscripcion.usuarios.ape_usu2 ?? ''}`.trim(),
      cedula: inscripcion.usuarios.ced_usu ?? "N/A",
      fecha: inscripcion.fec_ins.toISOString().split("T")[0],
      asistencia: inscripcion.asi_par ?? 0,
      nota: inscripcion.not_par ?? null
    }));

    return participantes;
  }
});
