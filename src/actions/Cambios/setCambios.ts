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
  handler: async (formData) => {
    try {
      // ⚠️ Extraer los valores y validarlos manualmente
      const parsed = CambioSchema.safeParse({
        rol_sol_cam: formData.get('rol_sol_cam'),
        des_cam: formData.get('des_cam'),
        mot_cam: formData.get('mot_cam'),
        pri_cam: formData.get('pri_cam'),
        tip_cam: formData.get('tip_cam'),
        ori_cam: formData.get('ori_cam'),
      });

      if (!parsed.success) {
        return {
          success: false,
          error: 'Datos inválidos',
          issues: parsed.error.flatten(),
        };
      }

      const archivo = formData.get('archivo') as File | null;

      // ⚠️ ID temporal, reemplaza con ID real del usuario si es necesario
      const id_cue_sol = '00000000-0000-0000-0000-000000000000';

      await prisma.cambios.create({
        data: {
          rol_sol_cam: parsed.data.rol_sol_cam,
          des_cam: parsed.data.des_cam,
          mot_cam: parsed.data.mot_cam,
          pri_cam: parsed.data.pri_cam ?? null,
          tip_cam: parsed.data.tip_cam ?? null,
          ori_cam: parsed.data.ori_cam ?? null,
          enl_doc_cam: archivo?.name ?? null,
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
