import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const eliminarCarrera = defineAction({
    accept: 'json',
    input: z.object({
        id_car: z.string().uuid('ID de carrera inválido'),
    }),
    handler: async (input) => {
        try {
            // Verificar que la carrera existe
            const carreraExistente = await prisma.carreras.findUnique({
                where: { id_car: input.id_car }
            });

            if (!carreraExistente) {
                return {
                    success: false,
                    message: 'La carrera no existe'
                };
            }

            // Verificar si la carrera tiene asignaciones relacionadas
            const asignacionesRelacionadas = await prisma.asignaciones.count({
                where: { id_car_asi: input.id_car }
            });

            if (asignacionesRelacionadas > 0) {
                return {
                    success: false,
                    message: `No se puede eliminar la carrera porque tiene ${asignacionesRelacionadas} asignación(es) relacionada(s)`
                };
            }

            // Verificar si la carrera tiene usuarios relacionados
            const usuariosRelacionados = await prisma.usuarios.count({
                where: { id_car_per: input.id_car }
            });

            if (usuariosRelacionados > 0) {
                return {
                    success: false,
                    message: `No se puede eliminar la carrera porque tiene ${usuariosRelacionados} usuario(s) relacionado(s)`
                };
            }

            // Eliminar la carrera
            await prisma.carreras.delete({
                where: { id_car: input.id_car }
            });

            return {
                success: true,
                message: 'Carrera eliminada correctamente',
                data: {
                    id: input.id_car,
                    nombre: carreraExistente.nom_car
                }
            };

        } catch (error: any) {
            console.error('Error al eliminar carrera:', error);

            // Manejo específico de errores de Prisma
            if (error.code === 'P2003') {
                return {
                    success: false,
                    message: 'No se puede eliminar la carrera porque tiene registros relacionados'
                };
            }

            if (error.code === 'P2025') {
                return {
                    success: false,
                    message: 'La carrera no fue encontrada'
                };
            }

            return {
                success: false,
                message: 'Error interno del servidor al eliminar la carrera'
            };
        }
    }
});
