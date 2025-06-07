import { defineAction } from 'astro:actions';
import { getSession } from 'auth-astro/server';
import prisma from '../../db';
import { generarCertificadoPDF } from './generateCertificado';
import { z } from 'zod';

export const GenerarCertificado = defineAction({
  input: z.object({
    eventoId: z.string().uuid({ message: 'ID de evento inválido.' }),
  }),

  handler: async (input, context) => {
    const session = await getSession(context.request);
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        error: { message: 'Usuario no autenticado.' },
      };
    }

    try {
      const inscripcion = await prisma.inscripciones.findFirst({
        where: {
          id_usu_ins: userId,
          id_eve_ins: input.eventoId,
          est_par: { in: ['COMPLETADO', 'APROBADO'] },
        },
        include: {
          usuarios: true,
          eventos: true,
        },
      });

      if (!inscripcion) {
        return {
          success: false,
          error: { message: 'No cumples los requisitos para obtener el certificado.' },
        };
      }

      const nombreCompleto = `${inscripcion.usuarios.nom_usu1} ${inscripcion.usuarios.nom_usu2 ?? ''} ${inscripcion.usuarios.ape_usu1} ${inscripcion.usuarios.ape_usu2 ?? ''}`.trim();
      const nombreEvento = inscripcion.eventos.nom_eve;
      const fechaCertificado = inscripcion.fec_cer_par?.toLocaleDateString('es-EC') ?? new Date().toLocaleDateString('es-EC');
      const calificacion = inscripcion.not_par?.toString() ?? 'Aprobado';

      const pdf = await generarCertificadoPDF({
        nombreUsuario: nombreCompleto,
        evento: nombreEvento,
        fecha: fechaCertificado,
        calificacion,
      });

      return new Response(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="certificado-${nombreEvento}.pdf"`,
        },
      });

    } catch (error: any) {
      console.error('Error al generar certificado:', error);
      return {
        success: false,
        error: { message: 'Error interno del servidor al generar el certificado.' },
      };
    }
  },
});
