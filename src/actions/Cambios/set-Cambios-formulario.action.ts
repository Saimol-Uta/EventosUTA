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
    archivo: z.string().optional(),
    id_usuario: z.string().optional(), // Este será el id_cue
});

export const createCambio = defineAction({
    accept: 'form',
    input: CambioSchema,
    handler: async (input) => {
        try {
            let id_cue_sol: string;

            if (input.id_usuario) {
                // Verificar que la cuenta existe
                const cuenta = await prisma.cuentas.findUnique({
                    where: {
                        id_cue: input.id_usuario
                    },
                    select: { id_cue: true }
                });

                if (!cuenta) {
                    throw new Error('No se encontró la cuenta del usuario');
                }

                id_cue_sol = cuenta.id_cue;
            } else {
                // Fallback: usar primera cuenta disponible
                const cuentaTemp = await prisma.cuentas.findFirst({
                    select: { id_cue: true }
                });

                if (!cuentaTemp) {
                    throw new Error('No se encontró una cuenta válida');
                }

                id_cue_sol = cuentaTemp.id_cue;
            }

            // Manejar archivo si existe
            let enl_doc_cam: string | null = null;

            if (input.archivo && input.archivo.trim() !== '') {
                enl_doc_cam = input.archivo;
            }

            const nuevoCambio = await prisma.cambios.create({
                data: {
                    rol_sol_cam: input.rol_sol_cam,
                    des_cam: input.des_cam,
                    mot_cam: input.mot_cam,
                    pri_cam: input.pri_cam,
                    tip_cam: input.tip_cam,
                    ori_cam: input.ori_cam,
                    enl_doc_cam,
                    id_cue_sol,
                },
            });

            return {
                success: true,
                message: 'Solicitud registrada correctamente',
                num_cam: nuevoCambio.num_cam,
                fec_cam: nuevoCambio.fec_cam,
            };
        } catch (error) {
            console.error('Error al crear cambio:', error);
            throw new Error('Error al registrar la solicitud de cambio');
        }
    },
});
