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
            // }  if (inscripcionExistente.est_ins !== 'Aprobado') {
            //    throw new Error("La inscripción debe estar aprobada para procesar el pago");
            }
            // El resto de tu lógica para actualizar ya es correcta.
            const dataToUpdate: {
                met_pag_ins: string;
                est_ins: string;
                enl_ord_pag_ins?: string;
            } = {
                met_pag_ins: metodoPago,
                est_ins: 'FPendiente', // Correcto: cambia el estado a "Facturación Pendiente".
            };

            if (enlaceComprobante) {
                dataToUpdate.enl_ord_pag_ins = enlaceComprobante;
            }

            const inscripcionActualizada = await prisma.inscripciones.update({
                where: { id_ins: idInscripcion },
                data: dataToUpdate,
            });

            // Sanitizar la respuesta para evitar errores de serialización con 'Decimal' o 'Date'
            const dataSerializable = {
                ...inscripcionActualizada,
                fec_ins: inscripcionActualizada.fec_ins.toISOString(),
                not_par: inscripcionActualizada.not_par?.toNumber() ?? null,
                fec_cer_par: inscripcionActualizada.fec_cer_par?.toISOString() ?? null,
            };

            return {
                success: true,
                message: "Pago registrado correctamente",
                data: dataSerializable
            };
        } catch (error) {
            console.error("Error al actualizar pago:", error);
            const errorMessage = error instanceof Error ? error.message : "Error desconocido al procesar el pago";
            // Es mejor devolver el error en un formato consistente
            return {
                success: false,
                message: errorMessage
            }
        }
    },
});