import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const eliminarCuenta = defineAction({
    accept: 'json',
    input: z.object({
        id_cue: z.string().uuid('ID de cuenta inválido'),
    }),
    handler: async (input) => {
        try {
            console.log("Eliminando cuenta con ID:", input.id_cue);

            // Verificar que la cuenta existe
            const cuentaExistente = await prisma.cuentas.findUnique({
                where: { id_cue: input.id_cue },
                include: {
                    usuarios: true, // Para obtener información del usuario asociado
                },
            });

            if (!cuentaExistente) {
                return {
                    success: false,
                    message: "La cuenta especificada no existe",
                };
            }

            // Eliminar la cuenta
            await prisma.cuentas.delete({
                where: { id_cue: input.id_cue },
            });

            return {
                success: true,
                message: "Cuenta eliminada correctamente",
                data: {
                    correo: cuentaExistente.cor_cue,
                    usuario: cuentaExistente.usuarios ?
                        `${cuentaExistente.usuarios.nom_usu1} ${cuentaExistente.usuarios.ape_usu1}` :
                        'Usuario desconocido',
                },
            };
        } catch (error) {
            console.error("Error al eliminar cuenta:", error);

            // Manejo específico de errores de Prisma
            if (error instanceof Error && 'code' in error) {
                const prismaError = error as any;
                if (prismaError.code === 'P2003') {
                    return {
                        success: false,
                        message: 'No se puede eliminar la cuenta porque tiene registros relacionados',
                    };
                }
            }

            return {
                success: false,
                message: "Error interno del servidor al eliminar la cuenta",
            };
        }
    },
});
