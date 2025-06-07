import { defineAction } from 'astro:actions';
import prisma from '../../db';
import { generarCertificadoPDF } from './generateCertificado';
import { z } from 'zod';
import { parse } from 'cookie'; // para leer cookies del header

export const GenerarCertificado = defineAction({
  input: z.object({
    eventoId: z.string().uuid({ message: 'ID de evento inválido.' }),
  }),

  handler: async (input, context) => {
    const { eventoId } = input;

    // Obtener cookie de sesión
    const cookieHeader = context.request.headers.get('cookie');
    if (!cookieHeader) {
      return {
        success: false,
        error: { message: 'Sesión no encontrada.' },
      };
    }

    const cookies = parse(cookieHeader);
    const sessionToken = cookies['session']; // o el nombre que uses para tu sesión

    if (!sessionToken) {
      return {
        success: false,
        error: { message: 'Usuario no autenticado.' },
      };
    }

    // Decodifica la cookie si es JWT, o simplemente busca el usuario si la cookie ya es un ID
    let userId: string;
    try {
      // Si usas JWT:
      // const payload = jwt.verify(sessionToken, process.env.JWT_SECRET) as { userId: string };
      // userId = payload.userId;

      // Si la cookie simplemente guarda el ID:
      userId = sessionToken; // por ejemplo, "08cd18a3-..." ya es el id_usu
    } catch (error) {
      return {
        success: false,
        error: { message: 'Sesión inválida.' },
      };
    }

    try {
      const inscripcion = await prisma.inscripciones.findFirst({
        where: {
          id_usu_ins: userId,
          id_eve_ins: eventoId,
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
