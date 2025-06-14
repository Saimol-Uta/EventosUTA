import db from "@/db";
import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";

export const updateEstadoInscripcion = defineAction({
    accept: "json",
    input: z.object({
        inscripcionId: z.string().min(1, "ID de inscripción requerido"),
        estado: z.enum(["Aprobado", "DPendiente", "FPendiente", "Rechazado"]),
        tipo: z.enum(["documentacion", "pago"]).optional(),
    }),
    handler: async (input) => {
        try {
            const { inscripcionId, estado, tipo } = input;
            console.log("Actualizando estado de inscripción:", { inscripcionId, estado, tipo });

            // Verificar que la inscripción existe
            const inscripcionExistente = await db.inscripciones.findUnique({
                where: { id_ins: inscripcionId },
                include: {
                    eventos: {
                        select: { nom_eve: true }
                    },
                    usuarios: {
                        select: { nom_usu1: true, nom_usu2: true, ape_usu1: true, ape_usu2: true }
                    }
                }
            });

            if (!inscripcionExistente) {
                throw new ActionError({
                    code: "NOT_FOUND",
                    message: "Inscripción no encontrada",
                });
            }

            // Mapear estados según los valores permitidos en la BD
            let nuevoEstado: string;
            let mensaje: string;

            if (estado === "Rechazado") {
                // Para rechazado, dependiendo del tipo, volver al estado pendiente correspondiente
                if (tipo === "documentacion") {
                    nuevoEstado = "DPendiente"; // Volver a documentación pendiente
                    mensaje = "Documentación rechazada, inscripción devuelta a estado pendiente";
                } else if (tipo === "pago") {
                    nuevoEstado = "FPendiente"; // Mantener en facturación pendiente
                    mensaje = "Pago rechazado, debe corregir la facturación";
                } else {
                    nuevoEstado = "DPendiente"; // Default
                    mensaje = "Inscripción rechazada";
                }
            } else if (tipo === "documentacion" && estado === "Aprobado") {
                // Si se aprueba la documentación, cambiar a FPendiente
                nuevoEstado = "FPendiente";
                mensaje = "Documentación aprobada, pendiente de facturación";
            } else if (tipo === "pago" && estado === "Aprobado") {
                // Si se aprueba el pago, cambiar a Aprobado completamente
                nuevoEstado = "Aprobado";
                mensaje = "Pago aprobado, inscripción completada";
            } else {
                // Para otros casos, usar el estado tal como viene
                nuevoEstado = estado;
                mensaje = `Estado actualizado a ${estado}`;
            }

            console.log("Nuevo estado calculado:", nuevoEstado);

            // Verificar que el nuevo estado es válido
            const estadosValidos = ["Aprobado", "DPendiente", "FPendiente"];
            if (!estadosValidos.includes(nuevoEstado)) {
                throw new ActionError({
                    code: "BAD_REQUEST",
                    message: `Estado no válido: ${nuevoEstado}. Estados permitidos: ${estadosValidos.join(", ")}`,
                });
            }

            // Actualizar el estado de la inscripción
            const inscripcionActualizada = await db.inscripciones.update({
                where: { id_ins: inscripcionId },
                data: {
                    est_ins: nuevoEstado,
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

            const nombreCompleto = `${inscripcionActualizada.usuarios?.nom_usu1 || ''} ${inscripcionActualizada.usuarios?.nom_usu2 || ''}`.trim();
            const apellidoCompleto = `${inscripcionActualizada.usuarios?.ape_usu1 || ''} ${inscripcionActualizada.usuarios?.ape_usu2 || ''}`.trim();

            return {
                success: true,
                message: `${mensaje} para ${nombreCompleto} ${apellidoCompleto}`,
                data: {
                    inscripcion: inscripcionActualizada,
                    nuevoEstado: nuevoEstado,
                    tipo: tipo,
                    accion: estado === "Rechazado" ? "rechazado" : "aprobado"
                },
            };

        } catch (error) {
            console.error("Error al actualizar estado de inscripción:", error);

            if (error instanceof ActionError) {
                throw error;
            }

            throw new ActionError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Error interno del servidor al actualizar el estado de la inscripción",
            });
        }
    },
});
