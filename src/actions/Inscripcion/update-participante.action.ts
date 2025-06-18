import db from "@/db";
import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";

export const updateParticipante = defineAction({
    accept: "form",
    input: z.object({
        inscripcionId: z.string().min(1, "ID de inscripción requerido"),
        // Los campos ahora son opcionales y pueden estar vacíos
        asistencia: z.string().optional().transform(val => {
            if (!val || val === "") return null;
            const num = parseInt(val);
            return isNaN(num) ? null : Math.max(0, Math.min(100, num));
        }),
        nota: z.string().optional().transform(val => {
            if (!val || val === "") return null;
            const num = parseFloat(val);
            return isNaN(num) ? null : Math.max(0, Math.min(10, num));
        }),
        // Eliminamos el campo estado porque ahora se calcula automáticamente
    }),
    handler: async (input) => {
        try {
            const { inscripcionId, asistencia, nota } = input;
            console.log("Datos recibidos para actualizar participante:", { inscripcionId, asistencia, nota });

            // Verificar que la inscripción existe y obtener los datos de la categoría
            const inscripcionExistente = await db.inscripciones.findUnique({
                where: { id_ins: inscripcionId },
                include: {
                    eventos: {
                        select: {
                            nom_eve: true,
                            categorias_eventos: {
                                select: {
                                    nom_cat: true,
                                    requiere_asistencia: true,
                                    requiere_puntaje: true,
                                    pun_apr_cat: true,
                                    asi_cat: true
                                }
                            }
                        }
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

            const categoria = inscripcionExistente.eventos?.categorias_eventos;
            if (!categoria) {
                throw new ActionError({
                    code: "BAD_REQUEST",
                    message: "No se pudo obtener la información de la categoría del evento",
                });
            }

            console.log("Requisitos de la categoría:", categoria);

            // Función para calcular el estado automáticamente
            function calcularEstadoParticipacion(
                asiPar: number | null,
                notPar: number | null,
                requiereAsistencia: boolean,
                requierePuntaje: boolean,
                puntajeAprobacion: number = 7.0,
                porcentajeAsistenciaMinimo: number = 70,
            ): string {
                console.log("=== CALCULANDO ESTADO EN BACKEND ===");
                console.log("Asistencia:", asiPar);
                console.log("Nota:", notPar);
                console.log("Requiere asistencia:", requiereAsistencia);
                console.log("Requiere puntaje:", requierePuntaje);

                // Si no requiere nada, está aprobado por defecto
                if (!requiereAsistencia && !requierePuntaje) {
                    return "APROBADA";
                }

                let cumpleAsistencia = true;
                let cumplePuntaje = true;

                // Verificar asistencia si es requerida
                if (requiereAsistencia) {
                    if (asiPar === null || asiPar === undefined) {
                        cumpleAsistencia = false;
                    } else if (asiPar < porcentajeAsistenciaMinimo) {
                        cumpleAsistencia = false;
                    }
                }

                // Verificar puntaje si es requerido
                if (requierePuntaje) {
                    if (notPar === null || notPar === undefined) {
                        cumplePuntaje = false;
                    } else if (notPar < puntajeAprobacion) {
                        cumplePuntaje = false;
                    }
                }

                // Determinar estado final
                if (cumpleAsistencia && cumplePuntaje) {
                    return "APROBADA";
                } else {
                    return "REPROBADA";
                }
            }            // Calcular el estado automáticamente
            const estadoCalculado = calcularEstadoParticipacion(
                asistencia,
                nota,
                categoria.requiere_asistencia || false,
                categoria.requiere_puntaje || false,
                Number(categoria.pun_apr_cat) || 7.0,
                Number(categoria.asi_cat) || 70
            );

            console.log("Estado calculado automáticamente:", estadoCalculado);

            // Actualizar la inscripción con los nuevos datos de participación
            const inscripcionActualizada = await db.inscripciones.update({
                where: { id_ins: inscripcionId },
                data: {
                    asi_par: asistencia,
                    not_par: nota,
                    est_par: estadoCalculado, // Estado calculado automáticamente
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
                message: `Calificación actualizada para ${nombreCompleto} ${apellidoCompleto}. Estado: ${estadoCalculado}`,
                data: {
                    inscripcion: inscripcionActualizada,
                    estadoCalculado: estadoCalculado,
                    asistencia: asistencia,
                    nota: nota
                },
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
