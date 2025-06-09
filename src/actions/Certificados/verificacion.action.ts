import { defineAction } from 'astro:actions';
import prisma from '../../db';
import { z } from 'zod';
import type { Decimal } from '@prisma/client/runtime/library';

export const verificarCertificado = defineAction({
    input: z.object({
        codigo: z.string().uuid({ message: "El formato del código no es válido." }),
    }),
    handler: async ({ codigo }) => {
        try {
            const inscripcion = await prisma.inscripciones.findUnique({
                where: {
                    id_ins: codigo,
                },
                include: {
                    usuarios: true,
                    eventos: true,
                },
            });

            if (!inscripcion) {
                return {
                    success: false,
                    error: { message: "No se encontró ningún certificado con ese código." },
                };
            }

            const asistenciaNum = inscripcion.asi_par ?? 0;
            const calificacionNum = (inscripcion.not_par as Decimal)?.toNumber() ?? 0.0;
            const estadoParticipacion = inscripcion.est_par;

            if (
                asistenciaNum < 70 ||
                calificacionNum < 7.0 ||
                estadoParticipacion !== 'APROBADA'
            ) {
                return {
                    success: false,
                    error: { message: "El código es correcto, pero el participante no cumple con todos los requisitos para la emisión del certificado." },
                };
            }

            return {
                success: true,
                data: {
                    nombreUsuario: `${inscripcion.usuarios.nom_usu1} ${inscripcion.usuarios.ape_usu1} ${inscripcion.usuarios.ape_usu2 ?? ''}`.trim(),
                    nombreEvento: inscripcion.eventos.nom_eve,
                    fechaEvento: inscripcion.eventos.fec_ini_eve.toLocaleDateString('es-EC', { year: 'numeric', month: 'long' }),
                    eventoId: inscripcion.id_eve_ins,
                },
            };

        } catch (error) {
            console.error("Error en la verificación:", error);
            return {
                success: false,
                error: { message: "Ocurrió un error en el servidor." },
            };
        }
    },
});