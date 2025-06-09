import { defineAction } from 'astro:actions';
import prisma from '../../db';
import { z } from 'astro:schema';

export const getCertificadosPorUsuario = defineAction({
  accept: 'json',
  input: z.object({
    idUsuario: z.string().uuid(),
  }),
  handler: async ({ idUsuario }) => {
    try {
      const inscripcionesConCertificado = await prisma.inscripciones.findMany({
        where: {
          id_usu_ins: idUsuario,
          enl_cer_par: { not: null },
          est_par: 'APROBADA',
        },
        include: {
          eventos: { select: { nom_eve: true } },
        },
        orderBy: { fec_cer_par: 'desc' }
      });

      // Devolvemos los objetos completos
      return {
        success: true,
        certificados: inscripcionesConCertificado,
      };
    } catch (error) {
      console.error('Error al obtener certificados:', error);
      return {
        success: false,
        error: { message: 'No se pudieron obtener los certificados del usuario.' },
      };
    }
  },
});