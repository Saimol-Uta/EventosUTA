import { defineAction } from 'astro:actions';
import prisma from '../../db';
import { z } from 'astro:schema';

export const actualizarPagoInscripcion = defineAction({
    accept: "json",
    input: z.object({
        idInscripcion: z.string().uuid(),
        metodoPago: z.string(),
        enlaceComprobante: z.string().optional(),
    }),
    handler: async ({ idInscripcion, metodoPago, enlaceComprobante }) => {
        try {
            // Verificar que la inscripción existe y está aprobada
            const inscripcionExistente = await prisma.inscripciones.findUnique({
                where: { id_ins: idInscripcion },
            });

            if (!inscripcionExistente) {
                throw new Error("Inscripción no encontrada");
            } if (inscripcionExistente.est_ins !== 'Aprobado') {
                throw new Error("La inscripción debe estar aprobada para procesar el pago");
            }

            // Actualizar la inscripción con los datos de pago
            const inscripcionActualizada = await prisma.inscripciones.update({
                where: { id_ins: idInscripcion },
                data: {
                    met_pag_ins: metodoPago,
                    enl_ord_pag_ins: enlaceComprobante,
                    est_ins: 'FPendiente', // Cambiar estado a pago pendiente de validación
                },
            });

            return {
                success: true,
                message: "Pago registrado correctamente",
                data: inscripcionActualizada
            };
        } catch (error) {
            console.error("Error al actualizar pago:", error);
            throw new Error(
                error instanceof Error
                    ? error.message
                    : "Error al procesar el pago"
            );
        }
    },
});
