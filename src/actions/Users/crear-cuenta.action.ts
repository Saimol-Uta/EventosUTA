import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const crearCuenta = defineAction({
    accept: 'form', input: z.object({
        id_usu_per: z.string().uuid('ID de usuario inválido'),
        cor_cue: z.string().email('Email inválido'),
        cont_cuenta: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
        rol_cue: z.enum(['usuario', 'estudiante', 'administrador', 'master']).default('usuario'),
    }),
    handler: async (input) => {
        try {
            console.log("Datos recibidos para crear cuenta:", input);

            // Verificar que el usuario existe
            const usuarioExistente = await prisma.usuarios.findUnique({
                where: { id_usu: input.id_usu_per },
            });

            if (!usuarioExistente) {
                return {
                    success: false,
                    message: "El usuario especificado no existe",
                };
            }

            // Verificar que no existe ya una cuenta con ese correo
            const cuentaExistente = await prisma.cuentas.findUnique({
                where: { cor_cue: input.cor_cue },
            });

            if (cuentaExistente) {
                return {
                    success: false,
                    message: "Ya existe una cuenta con este correo electrónico",
                };
            }            // Crear la nueva cuenta
            const nuevaCuenta = await prisma.cuentas.create({
                data: {
                    id_usu_per: input.id_usu_per,
                    cor_cue: input.cor_cue,
                    cont_cuenta: input.cont_cuenta, // En un entorno real, esto debería estar hasheado
                    rol_cue: input.rol_cue,
                },
            });

            return {
                success: true,
                message: "Cuenta creada correctamente",
                data: {
                    id: nuevaCuenta.id_cue,
                    correo: nuevaCuenta.cor_cue,
                    rol: nuevaCuenta.rol_cue,
                },
            };
        } catch (error) {
            console.error("Error al crear cuenta:", error);
            return {
                success: false,
                message: "Error interno del servidor al crear la cuenta",
            };
        }
    },
});
