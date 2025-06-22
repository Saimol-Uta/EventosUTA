import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import prisma from "@/db";

export const setDatosInscripcion = defineAction({
    accept: "json",
    input: z.object({
        idUsuario: z.string(), // Correo del usuario
        idEvento: z.string().uuid(),
        car_mot_eve: z.string().optional(), // Carta de motivación
    }),
    handler: async ({ idUsuario, idEvento, car_mot_eve }) => {
        console.log("DATOS RECIBIDOS EN setDatosInscripcion:", {
            idUsuario,
            idEvento,
            car_mot_eve,
        });
        try {
            // 1. Verificar que el usuario existe
            const usuario = await prisma.usuarios.findUnique({
                where: { cor_cue: idUsuario },
                include: {
                    carreras: {
                        include: {
                            facultades: true,
                        }
                    }
                }
            });

            if (!usuario) {
                return {
                    success: false,
                    message: "No se encontró el usuario.",
                };
            }

            // 2. Verificar que el evento existe
            const evento = await prisma.eventos.findUnique({
                where: { id_eve: idEvento },
                include: {
                    asignaciones: {
                        include: {
                            detalle_asignaciones: {
                                include: {
                                    carreras: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!evento) {
                return {
                    success: false,
                    message: "No se encontró el evento.",
                };
            }

            // 3. Verificar si ya está inscrito
            const existe = await prisma.inscripciones.findUnique({
                where: {
                    id_usu_ins_id_eve_ins: {
                        id_usu_ins: idUsuario,
                        id_eve_ins: idEvento,
                    },
                },
            });

            if (existe) {
                return {
                    success: false,
                    message: "Ya estás inscrito en este evento.",
                };
            }

            // 4. Verificar restricciones de asignación
            if (evento.asignaciones) {
                const tipoAsignacion = evento.asignaciones.tip_asi;
                const carrerasAsignacion = evento.asignaciones.detalle_asignaciones.map(det => det.carreras);

                if (tipoAsignacion === 'CARRERA') {
                    const carreraPermitida = carrerasAsignacion.some(carrera =>
                        carrera.id_car === usuario.id_car_per
                    );

                    if (!carreraPermitida) {
                        return {
                            success: false,
                            message: "No tienes acceso a este evento según tu carrera.",
                        };
                    }
                } else if (tipoAsignacion === 'FACULTAD') {
                    const facultadPermitida = carrerasAsignacion.some(carrera =>
                        carrera.id_fac_per === usuario.carreras?.id_fac_per
                    );

                    if (!facultadPermitida) {
                        return {
                            success: false,
                            message: "No tienes acceso a este evento según tu facultad.",
                        };
                    }
                }
            }

            // 5. Determinar estado inicial de la inscripción
            // Si el evento es gratuito, se aprueba automáticamente
            // Si es pagado, queda pendiente de validación por el administrador
            const esPagado = evento.precio && Number(evento.precio) > 0;
            const estadoInicial = esPagado ? "DPendiente" : "APROBADA";

            console.log("DATOS QUE SE GUARDARÁN EN LA BASE:", {
                id_usu_ins: idUsuario,
                id_eve_ins: idEvento,
                car_mot_inscrip: car_mot_eve,
                est_ins: estadoInicial,
            });

            const inscripcion = await prisma.inscripciones.create({
                data: {
                    id_usu_ins: idUsuario,
                    id_eve_ins: idEvento,
                    car_mot_inscrip: car_mot_eve || null,
                    est_ins: estadoInicial,
                    est_par: "PENDIENTE",
                    // Los campos de pago se establecen como null inicialmente
                    met_pag_ins: null,
                    enl_ord_pag_ins: null,
                },
            });

            return {
                success: true,
                message: "Inscripción realizada correctamente.",
                inscripcion,
            };
        } catch (error) {
            console.error("Error al inscribir:", error);
            return {
                success: false,
                message: "Error al guardar la inscripción.",
            };
        }
    },
});