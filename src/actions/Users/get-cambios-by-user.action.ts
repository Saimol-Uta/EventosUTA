import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const getCambiosByUser = defineAction({
    accept: 'json',
    input: z.object({
        userId: z.string().min(1, 'ID de usuario requerido'), // cor_cue
    }),
    handler: async (input) => {
        try {
            // Verificar que el usuario existe
            const usuario = await prisma.usuarios.findUnique({
                where: { cor_cue: input.userId }
            });

            if (!usuario) {
                return {
                    success: false,
                    message: 'Usuario no encontrado',
                    data: []
                };
            }

            // Obtener cambios/solicitudes del usuario
            const cambios = await prisma.cambios.findMany({
                where: {
                    id_cue_sol: input.userId
                },
                select: {
                    num_cam: true,
                    fec_cam: true,
                    rol_sol_cam: true,
                    des_cam: true,
                    mot_cam: true,
                    pri_cam: true,
                    tip_cam: true,
                    ori_cam: true,
                    enl_doc_cam: true,
                    est_cam: true
                },
                orderBy: {
                    fec_cam: 'desc'
                }
            });

            return {
                success: true,
                data: cambios,
                total: cambios.length,
                pendientes: cambios.filter(c => c.est_cam === 'PENDIENTE').length,
                aprobados: cambios.filter(c => c.est_cam === 'APROBADO').length,
                rechazados: cambios.filter(c => c.est_cam === 'RECHAZADO').length,
                message: `Se encontraron ${cambios.length} solicitudes para el usuario`
            };

        } catch (error) {
            console.error('Error al obtener cambios del usuario:', error);
            return {
                success: false,
                message: 'Error interno del servidor al obtener solicitudes de cambio',
                data: []
            };
        }
    }
});
