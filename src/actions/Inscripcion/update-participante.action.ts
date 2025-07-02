import db from "@/db";
import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";

export const updateParticipante = defineAction({
    accept: "form",
    input: z.object({
        inscripcionId: z.string().min(1, "ID de inscripción requerido"),
        // Los campos ahora son opcionales y pueden estar vacíos
        asistencia: z.string().optional().nullable().transform(val => {
            if (val === undefined || val === null || val === "") {
                return null;
            }
            const num = parseInt(val);
            return isNaN(num) ? null : Math.max(0, Math.min(100, num));
        }),
        nota: z.string().optional().nullable().transform(val => {
            if (val === undefined || val === null || val === "") {
                return null;
            }
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

            console.log("Requisitos de la categoría:", categoria);            // Función para calcular el estado automáticamente
            function calcularEstadoParticipacion(
                asiPar: number | null,
                notPar: number | null,
                requiereAsistencia: boolean,
                requierePuntaje: boolean,
                puntajeAprobacion: number = 7.0,
                porcentajeAsistenciaMinimo: number = 70
            ): string {
                console.log("=== CALCULANDO ESTADO EN BACKEND ===");
                console.log("Asistencia:", asiPar);
                console.log("Nota:", notPar);
                console.log("Requiere asistencia:", requiereAsistencia);
                console.log("Requiere puntaje:", requierePuntaje);
                console.log("Puntaje aprobación (mínimo):", puntajeAprobacion);
                console.log("Porcentaje asistencia mínimo:", porcentajeAsistenciaMinimo);

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
                        console.log("❌ No cumple asistencia: valor nulo o indefinido");
                    } else if (asiPar < porcentajeAsistenciaMinimo) {
                        cumpleAsistencia = false;
                        console.log(`❌ No cumple asistencia: ${asiPar}% < ${porcentajeAsistenciaMinimo}%`);
                    } else {
                        console.log(`✅ Cumple asistencia: ${asiPar}% >= ${porcentajeAsistenciaMinimo}%`);
                    }
                } else {
                    cumpleAsistencia = true; // No se requiere, se considera cumplido
                    console.log("ℹ️ No requiere asistencia");
                }

                // Verificar puntaje si es requerido
                if (requierePuntaje) {
                    if (notPar === null || notPar === undefined) {
                        cumplePuntaje = false;
                        console.log("❌ No cumple puntaje: valor nulo o indefinido");
                    } else if (notPar < puntajeAprobacion) {
                        cumplePuntaje = false;
                        console.log(`❌ No cumple puntaje: ${notPar} < ${puntajeAprobacion}`);
                    } else {
                        console.log(`✅ Cumple puntaje: ${notPar} >= ${puntajeAprobacion}`);
                    }
                } else {
                    cumplePuntaje = true; // No se requiere, se considera cumplido
                    console.log("ℹ️ No requiere puntaje");
                }

                // Determinar estado final
                console.log("=== EVALUACIÓN FINAL ===");
                console.log("Cumple asistencia:", cumpleAsistencia);
                console.log("Cumple puntaje:", cumplePuntaje);

                if (cumpleAsistencia && cumplePuntaje) {
                    console.log("✅ RESULTADO: APROBADA (cumple ambos requisitos)");
                    return "APROBADA";
                } else if (requiereAsistencia && !cumpleAsistencia) {
                     // If attendance is required but not met, it's REPROBADA
                     console.log("❌ RESULTADO: REPROBADA (asistencia insuficiente)");
                     return "REPROBADA";
                } else if (requierePuntaje && !cumplePuntaje) {
                    // If score is required but not met, it's REPROBADA
                    console.log("❌ RESULTADO: REPROBADA (puntaje insuficiente)");
                    return "REPROBADA";
                } else if (cumpleAsistencia && requiereAsistencia && !requierePuntaje) {
                    // If only attendance is required and met, and no score is required
                    console.log("✅ RESULTADO: ASISTIO (solo requiere asistencia y cumple)");
                    return "ASISTIO";
                } else if (cumplePuntaje && requierePuntaje && !requiereAsistencia) {
                    // If only score is required and met, and no attendance is required
                    console.log("✅ RESULTADO: APROBADA (solo requiere puntaje y cumple)");
                    return "APROBADA";
                } else {
                    // Default to PENDIENTE if none of the above conditions are met
                    console.log("❓ RESULTADO: PENDIENTE (criterios no cubiertos o falta de datos)");
                    return "PENDIENTE";
                }
            }

            // Calcular el estado automáticamente
            const estadoCalculado = calcularEstadoParticipacion(
                asistencia,
                nota,
                categoria.requiere_asistencia || false,
                categoria.requiere_puntaje || false,
                Number(categoria.pun_apr_cat) || 7.0,
                Number(categoria.asi_cat) || 70
            );

            console.log("Estado calculado automáticamente:", estadoCalculado);

            // Validar que el estado calculado sea uno de los valores permitidos
            const estadosPermitidos = ["PENDIENTE", "APROBADA", "REPROBADA", "ASISTIO"];
            if (!estadosPermitidos.includes(estadoCalculado)) {
                console.error("Estado calculado no válido:", estadoCalculado);
                throw new ActionError({
                    code: "BAD_REQUEST",
                    message: `Estado calculado no válido: ${estadoCalculado}`,
                });
            }

            console.log("=== DATOS PARA ACTUALIZAR EN BD ===");
            console.log("ID inscripción:", inscripcionId);
            console.log("Asistencia:", asistencia);
            console.log("Nota:", nota);
            console.log("Estado calculado:", estadoCalculado);
            console.log("===================================");

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

            console.log("=== INSCRIPCIÓN ACTUALIZADA ===");
            console.log("Estado en BD:", inscripcionActualizada.est_par);
            console.log("Asistencia en BD:", inscripcionActualizada.asi_par);
            console.log("Nota en BD:", inscripcionActualizada.not_par);
            console.log("==============================="); const nombreCompleto = `${inscripcionActualizada.usuarios?.nom_usu1 || ''} ${inscripcionActualizada.usuarios?.nom_usu2 || ''}`.trim();
            const apellidoCompleto = `${inscripcionActualizada.usuarios?.ape_usu1 || ''} ${inscripcionActualizada.usuarios?.ape_usu2 || ''}`.trim();

            // Convertir los datos a objetos serializables
            const inscripcionSerializable = {
                id_ins: inscripcionActualizada.id_ins,
                est_par: inscripcionActualizada.est_par,
                asi_par: inscripcionActualizada.asi_par,
                not_par: inscripcionActualizada.not_par ? Number(inscripcionActualizada.not_par) : null,
                evento: {
                    nom_eve: inscripcionActualizada.eventos?.nom_eve || null
                },
                usuario: {
                    nom_usu1: inscripcionActualizada.usuarios?.nom_usu1 || null,
                    nom_usu2: inscripcionActualizada.usuarios?.nom_usu2 || null,
                    ape_usu1: inscripcionActualizada.usuarios?.ape_usu1 || null,
                    ape_usu2: inscripcionActualizada.usuarios?.ape_usu2 || null
                }
            };

            return {
                success: true,
                message: `Calificación actualizada para ${nombreCompleto} ${apellidoCompleto}. Estado: ${estadoCalculado}`,
                data: {
                    inscripcion: inscripcionSerializable,
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
