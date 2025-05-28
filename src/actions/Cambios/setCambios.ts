import { defineAction } from 'astro:actions';
import prisma from '../../db';
import { z } from 'zod';

const CambioSchema = z.object({
  des_cam: z.string().min(1),
  mot_cam: z.string().min(1),
  pri_cam: z.string().optional(),
  tip_cam: z.string().optional(),
  ori_cam: z.string().optional(),
});

export const createCambio = defineAction({
  accept: 'form',
  handler: async (formData) => {
    try {
      // ⚠️ Extraer los valores y validarlos manualmente
      const parsed = CambioSchema.safeParse({
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
      const buffer = archivo ? Buffer.from(await archivo.arrayBuffer()) : null;

      // ⚠️ ID temporal, reemplaza con ID real del usuario si es necesario
      const id_cue_sol = '00000000-0000-0000-0000-000000000000';

      await prisma.cambios.create({
        data: {
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
