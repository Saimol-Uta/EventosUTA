import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const modificarCuenta = defineAction({
    accept: 'form',
    input: z.object({
        id_cue: z.string().uuid('ID de cuenta inválido'),
        rol_cue: z.enum(['usuario', 'estudiante', 'administrador', 'master']),
        con_cue: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
    }),
    handler: async (input) => {
        try {
            console.log("Datos recibidos para modificar cuenta:", input);

            // Verificar que la cuenta existe
            const cuentaExistente = await prisma.cuentas.findUnique({
                where: { id_cue: input.id_cue },
            });

            if (!cuentaExistente) {
                return {
                    success: false,
                    message: "La cuenta especificada no existe",
                };
            }

            // Preparar datos para actualizar
            const dataToUpdate: any = {
                rol_cue: input.rol_cue,
            };

            // Solo actualizar contraseña si se proporciona
            if (input.con_cue) {
                dataToUpdate.con_cue = input.con_cue; // En un entorno real, esto debería estar hasheado
            }

            // Actualizar la cuenta
            const cuentaActualizada = await prisma.cuentas.update({
                where: { id_cue: input.id_cue },
                data: dataToUpdate,
            });

            return {
                success: true,
                message: "Cuenta actualizada correctamente",
                data: {
                    id: cuentaActualizada.id_cue,
                    correo: cuentaActualizada.cor_cue,
                    rol: cuentaActualizada.rol_cue,
                },
            };
        } catch (error) {
            console.error("Error al modificar cuenta:", error);
            return {
                success: false,
                message: "Error interno del servidor al modificar la cuenta",
            };
        }
    },
});
