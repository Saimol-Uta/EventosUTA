import { defineAction } from 'astro:actions';
import prisma from '../../db';
import { z } from 'astro:schema';

export const getDatosInscripcion = defineAction({
    accept: "json",
    input: z.object({
        idUsuario: z.string(), // Correo del usuario
        idEvento: z.string().uuid(),
    }),
    handler: async ({ idUsuario, idEvento }) => {
        console.log("ID USUARIO (correo):", idUsuario);

        // Buscar el usuario por su correo
        const usuario = await prisma.usuarios.findUnique({
            where: { cor_cue: idUsuario },
            include: {
                carreras: {
                    include: {
                        facultades: true,
                    }
                }
            },
        });



        const evento = await prisma.eventos.findUnique({
            where: { id_eve: idEvento },
            include: {
                categorias_eventos: true,
                organizadores: true,
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

        // Si usuario existe, buscar inscripción previa
        const inscripcion = usuario
            ? await prisma.inscripciones.findUnique({
                where: {
                    id_usu_ins_id_eve_ins: {
                        id_usu_ins: usuario.cor_cue,
                        id_eve_ins: idEvento,
                    },
                },
            })
            : null;        // Verificar si el usuario puede inscribirse según la asignación del evento
        let puedeInscribirse = true;
        let razonRestricciones = '';
        let esEstudiante = false;
        let tipoUsuario = 'PUBLICO_GENERAL';

        // Determinar tipo de usuario
        if (usuario?.carreras && usuario.id_car_per) {
            esEstudiante = true;
            tipoUsuario = 'ESTUDIANTE';
        }

        if (evento?.asignaciones) {
            const tipoAsignacion = evento.asignaciones.tip_asi;
            const carrerasAsignacion = evento.asignaciones.detalle_asignaciones.map(det => det.carreras);

            // Si el evento requiere estudiantes pero el usuario no es estudiante
            if ((tipoAsignacion === 'CARRERA' || tipoAsignacion === 'FACULTAD') && !esEstudiante) {
                puedeInscribirse = false;
                razonRestricciones = 'Este evento está restringido solo para estudiantes de la universidad';
            }
            // Si es estudiante, verificar restricciones específicas
            else if (esEstudiante && usuario) {
                if (tipoAsignacion === 'CARRERA') {
                    const carreraPermitida = carrerasAsignacion.some(carrera =>
                        carrera.id_car === usuario.id_car_per
                    );

                    if (!carreraPermitida) {
                        puedeInscribirse = false;
                        razonRestricciones = `Este evento está restringido a carreras específicas. Tu carrera (${usuario.carreras?.nom_car || 'No definida'}) no tiene acceso`;
                    }
                } else if (tipoAsignacion === 'FACULTAD') {
                    const facultadPermitida = carrerasAsignacion.some(carrera =>
                        carrera.id_fac_per === usuario.carreras?.id_fac_per
                    );

                    if (!facultadPermitida) {
                        puedeInscribirse = false;
                        razonRestricciones = `Este evento está restringido a facultades específicas. Tu facultad (${usuario.carreras?.facultades?.nom_fac || 'No definida'}) no tiene acceso`;
                    }
                }
            }
            // GENERAL y EXTERNO permiten cualquier usuario
        }

        if (!evento) {
            throw new Error("Evento no encontrado");
        } return {
            data: {
                usuario,
                evento: {
                    ...evento,
                    requiere_carta: evento.requiere_carta,
                },
                inscripcion,
                puede_inscribirse: puedeInscribirse,
                razon_restricciones: razonRestricciones,
                es_estudiante: esEstudiante,
                tipo_usuario: tipoUsuario,
                carreras_asignacion: evento.asignaciones?.detalle_asignaciones.map(det => det.carreras) || [],
                informacion_academica: esEstudiante ? {
                    carrera: usuario?.carreras?.nom_car,
                    facultad: usuario?.carreras?.facultades?.nom_fac,
                    codigo_carrera: usuario?.carreras?.cod_car
                } : null
            }
        };
    },
});
