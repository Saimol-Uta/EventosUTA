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
                    _count: {
                        select: { inscripciones: true },
                    },
                },
            });

            if (!evento) {
                return {
                    success: false,
                    message: "No se encontró el evento.",
                };
            }

            // 2.1. Verificar cupos disponibles
            if (evento.cup_max && evento.cup_max > 0) {
                const cuposDisponibles = evento.cup_max - (evento._count?.inscripciones ?? 0);
                if (cuposDisponibles <= 0) {
                    return {
                        success: false,
                        message: "No hay cupos disponibles para este evento.",
                    };
                }
            }

            // 3. Verificar requisitos del usuario
            const requisitos = [];

            // Verificar que tenga cédula subida
            if (!usuario.enl_ced_cue || usuario.enl_ced_cue.trim() === '') {
                requisitos.push("Debes subir tu cédula de identidad en tu perfil");
            }

            // Verificar datos personales completos
            if (!usuario.nom_usu1 || usuario.nom_usu1.trim() === '') {
                requisitos.push("Primer nombre es requerido");
            }
            if (!usuario.ape_usu1 || usuario.ape_usu1.trim() === '') {
                requisitos.push("Primer apellido es requerido");
            }
            if (!usuario.ape_usu2 || usuario.ape_usu2.trim() === '') {
                requisitos.push("Segundo apellido es requerido");
            }

            if (requisitos.length > 0) {
                return {
                    success: false,
                    message: `Completa tu perfil antes de inscribirte: ${requisitos.join(', ')}`,
                };
            }            // 4. Verificar si ya está inscrito
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
            }            // 5. Verificar restricciones de asignación
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
            }            // 6. Determinar estado inicial de la inscripción
            // Todas las inscripciones comienzan como "DPendiente"
            // El administrador debe aprobarlas manualmente
            const estadoInicial = "DPendiente";



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