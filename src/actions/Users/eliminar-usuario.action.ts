import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const eliminarUsuario = defineAction({
    accept: 'json',
    input: z.object({
        id_usuario: z.string().min(1, 'ID de usuario requerido'), // Cambié de uuid a string para manejar cor_cue
    }),
    handler: async (input) => {
        try {
            // Verificar que el usuario existe usando cor_cue como identificador
            const usuarioExistente = await prisma.usuarios.findUnique({
                where: { cor_cue: input.id_usuario },
                include: {
                    carreras: true,
                    inscripciones: true,
                    cambios: true
                }
            });

            if (!usuarioExistente) {
                return {
                    success: false,
                    message: 'El usuario no existe'
                };
            }

            // Verificar si el usuario tiene inscripciones
            if (usuarioExistente.inscripciones.length > 0) {
                return {
                    success: false,
                    message: `No se puede eliminar el usuario porque tiene ${usuarioExistente.inscripciones.length} inscripción(es) relacionada(s). Debe eliminar primero las inscripciones.`
                };
            }

            // Verificar si el usuario tiene cambios/solicitudes pendientes
            const cambiosPendientes = usuarioExistente.cambios.filter(c => c.est_cam === 'PENDIENTE');
            if (cambiosPendientes.length > 0) {
                return {
                    success: false,
                    message: `No se puede eliminar el usuario porque tiene ${cambiosPendientes.length} solicitud(es) de cambio pendiente(s)`
                };
            }

            // Primero eliminar cambios asociados (si los hay)
            if (usuarioExistente.cambios.length > 0) {
                await prisma.cambios.deleteMany({
                    where: { id_cue_sol: input.id_usuario }
                });
            }

            // Eliminar el usuario
            await prisma.usuarios.delete({
                where: { cor_cue: input.id_usuario }
            });

            return {
                success: true,
                message: 'Usuario eliminado correctamente',
                data: {
                    cor_cue: input.id_usuario,
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
