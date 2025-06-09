import db from "@/db";
import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";

export const updateParticipante = defineAction({
    accept: "form",
    input: z.object({
        inscripcionId: z.string().min(1, "ID de inscripción requerido"),
        asistencia: z.string().transform(val => parseInt(val)).pipe(z.number().min(0).max(1)),
        nota: z.string().transform(val => parseFloat(val)).pipe(z.number().min(0).max(10)),
        estado: z.enum(["PENDIENTE", "APROBADA", "REPROBADA", "ASISTIO"]),
    }),
    handler: async (input) => {
        try {
            const { inscripcionId, asistencia, nota, estado } = input;
            console.log("Datos recibidos para actualizar participante:", { inscripcionId, asistencia, nota, estado });

            // Verificar que la inscripción existe
            const inscripcionExistente = await db.inscripciones.findUnique({
                where: { id_ins: inscripcionId },
                include: {
                    eventos: {
                        select: { nom_eve: true }
                    },
                    usuarios: {
                        select: { nom_usu1: true, ape_usu1: true }
                    }
                }
            });

            if (!inscripcionExistente) {
                throw new ActionError({
                    code: "NOT_FOUND",
                    message: "Inscripción no encontrada",
                });
            }

            let asistenciaCompleta: number = 0;

            if (asistencia === 1) {
                asistenciaCompleta = 100
            }
            else {
                asistenciaCompleta = 0
            }

            // Actualizar la inscripción con los nuevos datos de participación
            const inscripcionActualizada = await db.inscripciones.update({
                where: { id_ins: inscripcionId },
                data: {
                    asi_par: asistenciaCompleta,
                    not_par: nota,
                    est_par: estado,
                },
                include: {
                    eventos: {
                        select: { nom_eve: true }
                    },
                    usuarios: {
                        select: { nom_usu1: true, nom_usu2: true, ape_usu1: true, ape_usu2: true }
                    }
                }
            });

            const InscripcionPlanos = JSON.parse(JSON.stringify(inscripcionActualizada.eventos));

            return {
                success: true,
                message: `Calificación actualizada para ${InscripcionPlanos.usuarios?.nom_usu1} ${InscripcionPlanos.usuarios?.ape_usu1}`,
                data: InscripcionPlanos,
            };

        } catch (error) {
            console.error("Error al actualizar participante:", error);

            if (error instanceof ActionError) {
                throw error;
            }

            throw new ActionError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Error interno del servidor al actualizar la calificación",
            });
        }
    },
});
