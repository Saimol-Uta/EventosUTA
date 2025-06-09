import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const eliminarUsuario = defineAction({
    accept: 'json',
    input: z.object({
        id_usuario: z.string().uuid('ID de usuario inválido'),
    }),
    handler: async (input) => {
        try {
            // Verificar que el usuario existe
            const usuarioExistente = await prisma.usuarios.findUnique({
                where: { id_usu: input.id_usuario },
                include: {
                    cuentas: true // Verificar cuentas asociadas
                }
            });

            if (!usuarioExistente) {
                return {
                    success: false,
                    message: 'El usuario no existe'
                };
            }

            // Verificar si el usuario tiene cuentas asociadas
            if (usuarioExistente.cuentas.length > 0) {
                return {
                    success: false,
                    message: `No se puede eliminar el usuario porque tiene ${usuarioExistente.cuentas.length} cuenta(s) asociada(s). Debe eliminar primero las cuentas.`
                };
            }            // Verificar si el usuario tiene inscripciones
            const inscripciones = await prisma.inscripciones.count({
                where: {
                    id_usu_ins: input.id_usuario
                }
            });

            if (inscripciones > 0) {
                return {
                    success: false,
                    message: `No se puede eliminar el usuario porque tiene ${inscripciones} inscripción(es) relacionada(s)`
                };
            }

            // Eliminar el usuario
            await prisma.usuarios.delete({
                where: { id_usu: input.id_usuario }
            });

            return {
                success: true,
                message: 'Usuario eliminado correctamente',
                data: {
                    id: input.id_usuario,
                    nombre: `${usuarioExistente.nom_usu1} ${usuarioExistente.ape_usu1}`
                }
            };

        } catch (error: any) {
            console.error('Error al eliminar usuario:', error);

            // Manejo específico de errores de Prisma
            if (error.code === 'P2003') {
                return {
                    success: false,
                    message: 'No se puede eliminar el usuario porque tiene registros relacionados'
                };
            }

            if (error.code === 'P2025') {
                return {
                    success: false,
                    message: 'El usuario no fue encontrado'
                };
            }

            return {
                success: false,
                message: 'Error interno del servidor al eliminar el usuario'
            };
        }
    }
});
