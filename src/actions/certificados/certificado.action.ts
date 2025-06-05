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
    const accountId = session?.user?.id; // Este es el id_cue

    if (!accountId) {
      return {
        success: false,
        error: { message: 'Usuario no autenticado.' },
      };
    }

    try {
      // --- PASO 1: Buscar la CUENTA por su ID e INCLUIR el USUARIO asociado ---
      // Usamos el ID de la sesión (accountId) para encontrar la cuenta.
      const cuentaConUsuario = await prisma.cuentas.findUnique({
        where: {
          id_cue: accountId,
        },
        include: {
          usuarios: true, // ¡Aquí incluimos los datos del modelo 'usuarios'!
        },
      });

      // Si no se encuentra la cuenta o no tiene un usuario asociado
      if (!cuentaConUsuario || !cuentaConUsuario.usuarios) {
        return {
          success: false,
          error: { message: 'No se encontró un perfil de usuario para esta cuenta.' },
        };
      }

      // --- PASO 2: Extraer el ID de usuario correcto ---
      // Ahora obtenemos el 'id_usu' del objeto 'usuarios' que incluimos.
      const userId = cuentaConUsuario.usuarios.id_usu;

      // --- PASO 3: Usar el 'userId' correcto para buscar la inscripción ---
      const inscripcion = await prisma.inscripciones.findFirst({
        where: {
          id_usu_ins: userId, // Ahora sí estamos usando el ID correcto
          id_eve_ins: input.eventoId,
          est_par: 'APROBADA',
        },
        include: {
          // Ya no necesitamos incluir 'usuarios' aquí si no lo usas más abajo,
          // pero lo dejamos por si acaso.
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

      // El resto de tu código para generar el PDF sigue igual...
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

      const pdfBase64 = Buffer.from(pdf).toString('base64');

      return {
        success: true,
        data: {
          pdfBase64,
          fileName: `certificado-${nombreEvento}.pdf`,
        },
      };

    } catch (error: any) {
      console.error('Error al generar certificado:', error);
      return {
        success: false,
        error: { message: 'Error interno del servidor al generar el certificado.' },
      };
    }
  },
});