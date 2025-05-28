import { defineAction } from 'astro:actions';
import prisma from '../../db';
import { z } from 'zod';

const CambioSchema = z.object({
    rol_sol_cam: z.enum(['ESTUDIANTE', 'DOCENTE', 'GENERAL']),
    des_cam: z.string().min(1, 'La descripción es obligatoria'),
    mot_cam: z.string().min(1, 'El motivo es obligatorio'),
    pri_cam: z.string().min(1, 'La prioridad es obligatoria'),
    tip_cam: z.string().min(1, 'El tipo de cambio es obligatorio'),
    ori_cam: z.string().min(1, 'El origen del cambio es obligatorio'),
});

export const createCambio = defineAction({
    accept: 'form',
    input: CambioSchema,
    handler: async (input) => {
        try {
            // TODO: Obtener el ID real del usuario autenticado
            const id_cue_sol = '00000000-0000-0000-0000-000000000000';

            await prisma.cambios.create({
                data: {
                    rol_sol_cam: input.rol_sol_cam,
                    des_cam: input.des_cam,
                    mot_cam: input.mot_cam,
                    pri_cam: input.pri_cam,
                    tip_cam: input.tip_cam,
                    ori_cam: input.ori_cam,
                    enl_doc_cam: null, // Manejar archivo por separado si es necesario
                    id_cue_sol,
                },
            });

            return {
                success: true,
                message: 'Solicitud registrada correctamente',
            };
        } catch (error) {
            console.error(error);
            return {
                success: false,
                error: 'Error al registrar el cambio',
            };
        }
    },
});
