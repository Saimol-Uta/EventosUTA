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

        console.log("USUARIO ENCONTRADO:", usuario);

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
            : null;

        // Verificar si el usuario puede inscribirse según la asignación del evento
        let puedeInscribirse = true;
        let razonRestricciones = '';

        if (evento?.asignaciones && usuario) {
            const tipoAsignacion = evento.asignaciones.tip_asi;
            const carrerasAsignacion = evento.asignaciones.detalle_asignaciones.map(det => det.carreras);

            if (tipoAsignacion === 'CARRERA') {
                // Verificar si la carrera del usuario está en las carreras permitidas
                const carreraPermitida = carrerasAsignacion.some(carrera =>
                    carrera.id_car === usuario.id_car_per
                );

                if (!carreraPermitida) {
                    puedeInscribirse = false;
                    razonRestricciones = 'Este evento está restringido a carreras específicas';
                }
            } else if (tipoAsignacion === 'FACULTAD') {
                // Verificar si la facultad del usuario está en las facultades permitidas
                const facultadPermitida = carrerasAsignacion.some(carrera =>
                    carrera.id_fac_per === usuario.carreras?.id_fac_per
                );

                if (!facultadPermitida) {
                    puedeInscribirse = false;
                    razonRestricciones = 'Este evento está restringido a facultades específicas';
                }
            }
            // GENERAL y EXTERNO permiten cualquier usuario
        }

        return {
            data: {
                usuario,
                evento,
                inscripcion,
                puede_inscribirse: puedeInscribirse,
                razon_restricciones: razonRestricciones,
                carreras_asignacion: evento?.asignaciones?.detalle_asignaciones.map(det => det.carreras) || [],
            }
        };
    },
});
