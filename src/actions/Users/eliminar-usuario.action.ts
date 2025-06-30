import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const eliminarUsuario = defineAction({
    accept: 'json',
    input: z.object({
        id_usuario: z.string().min(1, 'ID de usuario requerido'), // Cambié de uuid a string para manejar cor_cue
    }),
    handler: async ({ id_usuario }) => {
        try {
            // Usamos una transacción para agrupar las operaciones.
            // O todas tienen éxito, o todas fallan.
            await prisma.$transaction(async (tx) => {
                
                // Primero, verificamos si hay inscripciones activas, que es la condición que bloquea el borrado.
                // Es más eficiente contar que traer todos los registros.
                const inscripcionesCount = await tx.inscripciones.count({
                    where: { id_usu_ins: id_usuario },
                });

                if (inscripcionesCount > 0) {
                    // Si hay inscripciones, lanzamos un error para detener la transacción.
                    throw new Error(`No se puede eliminar: el usuario tiene ${inscripcionesCount} inscripción(es) activa(s).`);
                }

                // Si no hay inscripciones, procedemos a borrar los registros relacionados que sí podemos eliminar.
                // Eliminamos primero los 'cambios' asociados al usuario.
                await tx.cambios.deleteMany({
                    where: { id_cue_sol: id_usuario },
                });

                // Finalmente, eliminamos al usuario.
                // Esta operación es ahora segura porque ya verificamos las inscripciones.
                await tx.usuarios.delete({
                    where: { cor_cue: id_usuario },
                });
            });

            // Si la transacción se completó sin errores, devolvemos éxito.
            return {
                success: true,
                message: 'Usuario y sus datos asociados han sido eliminados correctamente.',
            };

        } catch (error: any) {
            console.error('Error al eliminar usuario:', error);

            // Manejo de errores simplificado.
            // Si nuestro 'throw' personalizado se activó, su mensaje llegará aquí.
            // Si Prisma falla por otra razón, también lo atrapamos.
            return {
                success: false,
                error: error.message || 'Error interno del servidor al eliminar el usuario.',
            };
        }
    },
});