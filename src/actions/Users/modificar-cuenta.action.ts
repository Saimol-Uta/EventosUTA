import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';
import bcrypt from 'bcryptjs';

export const modificarCuenta = defineAction({
    accept: 'form',
    input: z.object({
        cor_cue: z.string().email('Correo electrónico inválido'),
        rol_cue: z.enum(['USUARIO', 'ESTUDIANTE', 'ADMINISTRADOR', 'MASTER']),
        cont_cuenta: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
    }),
    handler: async (input) => {
        try {
            console.log("Datos recibidos para modificar cuenta:", input);

            // Verificar que el usuario existe
            const usuarioExistente = await prisma.usuarios.findUnique({
                where: { cor_cue: input.cor_cue },
            });

            if (!usuarioExistente) {
                return {
                    success: false,
                    message: "El usuario especificado no existe",
                };
            }

            // Preparar datos para actualizar
            const dataToUpdate: any = {
                rol_cue: input.rol_cue,
            };

            // Solo actualizar contraseña si se proporciona
            if (input.cont_cuenta) {
                const hashedPassword = await bcrypt.hash(input.cont_cuenta, 10);
                dataToUpdate.cont_cuenta = hashedPassword;
            }

            // Actualizar el usuario
            const usuarioActualizado = await prisma.usuarios.update({
                where: { cor_cue: input.cor_cue },
                data: dataToUpdate,
            });

            return {
                success: true,
                message: "Usuario actualizado correctamente",
                data: {
                    correo: usuarioActualizado.cor_cue,
                    rol: usuarioActualizado.rol_cue,
                    nombre: `${usuarioActualizado.nom_usu1} ${usuarioActualizado.ape_usu1}`,
                },
            };
        } catch (error) {
            console.error("Error al modificar usuario:", error);
            return {
                success: false,
                message: "Error interno del servidor al modificar el usuario",
            };
        }
    },
});
