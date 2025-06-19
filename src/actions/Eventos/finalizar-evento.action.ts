import db from "@/db";
import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";

export const finalizarEvento = defineAction({
    accept: "form",
    input: z.object({
        eventoId: z.string().min(1, "ID del evento requerido"),
    }),
    handler: async (input) => {
        try {
            const { eventoId } = input;
            console.log("Finalizando evento:", eventoId);

            // Verificar que el evento existe y está activo
            const eventoExistente = await db.eventos.findUnique({
                where: { id_eve: eventoId },
                select: {
                    id_eve: true,
                    nom_eve: true,
                    estado_evento: true,
                }
            });

            if (!eventoExistente) {
                throw new ActionError({
                    code: "NOT_FOUND",
                    message: "Evento no encontrado",
                });
            }

            if (eventoExistente.estado_evento === "FINALIZADO") {
                throw new ActionError({
                    code: "BAD_REQUEST",
                    message: "El evento ya está finalizado",
                });
            }

            // Actualizar el estado del evento a FINALIZADO
            const eventoActualizado = await db.eventos.update({
                where: { id_eve: eventoId },
                data: {
                    estado_evento: "FINALIZADO",
                },
                select: {
                    id_eve: true,
                    nom_eve: true,
                    estado_evento: true,
                }
            });

            console.log("Evento finalizado exitosamente:", eventoActualizado);

            return {
                success: true,
                message: `Evento "${eventoExistente.nom_eve}" finalizado exitosamente`,
                data: {
                    evento: eventoActualizado,
                },
            };

        } catch (error) {
            console.error("Error al finalizar evento:", error);

            if (error instanceof ActionError) {
                throw error;
            }

            throw new ActionError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Error interno del servidor al finalizar el evento",
            });
        }
    },
});
