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
                        select: {
                            nom_eve: true,
                            precio: true,
                            es_gratuito: true,
                            requiere_carta: true,
                            car_mot_eve: true
                        }
                    }, usuarios: {
                        select: {
                            nom_usu1: true,
                            nom_usu2: true,
                            ape_usu1: true,
                            ape_usu2: true,
                            enl_ced_cue: true,
                            enl_mat_cue: true,
                            rol_cue: true
                        }
                    }
                }
            });

            if (!inscripcionExistente) {
                throw new ActionError({
                    code: "NOT_FOUND",
                    message: "Inscripción no encontrada",
                });
            }

            // CONTROL 1: Verificar requisitos de pago
            const evento = inscripcionExistente.eventos;
            const esPago = !evento.es_gratuito && evento.precio && Number(evento.precio) > 0;

            if (esPago && tipo === "pago" && estado === "Aprobado") {
                // Si es un evento de pago y se intenta aprobar el pago, verificar que existe orden de pago
                if (!inscripcionExistente.enl_ord_pag_ins) {
                    throw new ActionError({
                        code: "BAD_REQUEST",
                        message: `No se puede aprobar el pago para el evento "${evento.nom_eve}". Es obligatorio subir la orden de pago para eventos con costo de $${Number(evento.precio).toFixed(2)}.`,
                    });
                }
            }

            // CONTROL 2: Verificar requisitos de documentación del evento
            if (tipo === "documentacion" && estado === "Aprobado") {
                const usuario = inscripcionExistente.usuarios;

                // Verificar documentos obligatorios básicos
                if (!usuario?.enl_ced_cue) {
                    throw new ActionError({
                        code: "BAD_REQUEST",
                        message: `No se puede aprobar la documentación para el evento "${evento.nom_eve}". Es obligatorio que el usuario suba su cédula de identidad.`,
                    });
                }

                // Si el evento requiere carta de motivación, verificar que existe
                if (evento.requiere_carta && !inscripcionExistente.car_mot_inscrip) {
                    throw new ActionError({
                        code: "BAD_REQUEST",
                        message: `No se puede aprobar la documentación para el evento "${evento.nom_eve}". Este evento requiere carta de motivación.`,
                    });
                }

                // Verificar matrícula para estudiantes (descomentarla si es necesario)
                if (usuario.rol_cue === "ESTUDIANTE" && !usuario.enl_mat_cue) {
                    throw new ActionError({
                        code: "BAD_REQUEST",
                        message: `No se puede aprobar la documentación para el evento "${evento.nom_eve}". Es obligatorio que los estudiantes suban su matrícula.`,
                    });
                }
            }

            console.log("Validaciones de requisitos completadas exitosamente");

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
