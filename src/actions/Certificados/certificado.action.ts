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
    const accountId = session?.user?.id;

    if (!accountId) {
      return {
        success: false,
        error: { message: 'Usuario no autenticado.' },
      };
    }

    try {
      const cuentaConUsuario = await prisma.cuentas.findUnique({
        where: {
          id_cue: accountId,
        },
        include: {
          usuarios: true,
        },
      });

      if (!cuentaConUsuario || !cuentaConUsuario.usuarios) {
        return {
          success: false,
          error: { message: 'No se encontró un perfil de usuario para esta cuenta.' },
        };
      }

      const userId = cuentaConUsuario.usuarios.id_usu;

      const inscripcion = await prisma.inscripciones.findFirst({
        where: {
          id_usu_ins: userId,
          id_eve_ins: input.eventoId,
          est_par: 'APROBADA',
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

      const nombreCurso = inscripcion.eventos.nom_eve;

      // Opciones para formatear las fechas en español
      const opcionesFechaCorta = { day: 'numeric', month: 'long' } as const;
      const opcionesFechaLarga = { day: 'numeric', month: 'long', year: 'numeric' } as const;
      
      const fechaInicioFmt = inscripcion.eventos.fec_ini_eve.toLocaleDateString('es-EC', opcionesFechaCorta);
      // Usamos la fecha de fin del evento, o si no existe, usamos la de inicio
      const fechaFinFmt = (inscripcion.eventos.fec_fin_eve ?? inscripcion.eventos.fec_ini_eve).toLocaleDateString('es-EC', opcionesFechaLarga);

      // Usamos 'dur_eve' que parece más apropiado. Si es nulo, ponemos '40' como fallback.
      const duracionHoras = inscripcion.eventos.dur_eve?.toString() ?? '40';
      // Si prefieres usar la nota del participante, descomenta la siguiente línea y comenta la de arriba:
      // const duracionHoras = inscripcion.not_par?.toString() ?? 'Aprobado';

      const fechaGeneracion = (inscripcion.fec_cer_par ?? new Date()).toLocaleDateString('es-EC', opcionesFechaLarga);

      // --- Llamada a la función que genera el PDF ---
      const pdf = await generarCertificadoPDF({
        nombreUsuario: nombreCompleto,
        nombreCurso: nombreCurso,
        fechaInicio: fechaInicioFmt,
        fechaFin: fechaFinFmt,
        duracionHoras: duracionHoras,
        fechaGeneracion: fechaGeneracion,
      });

      const pdfBase64 = Buffer.from(pdf).toString('base64');

      return {
        success: true,
        data: {
          pdfBase64,
          fileName: `certificado-${nombreCurso}.pdf`,
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

export const generarCertificadoPublico = defineAction({
  // Recibe el ID único de la inscripción (el código)
  input: z.object({
    inscripcionId: z.string().uuid({ message: "El formato del código no es válido." }),
  }),

  // NOTA: No usamos 'context' porque no necesitamos la sesión de usuario
  handler: async ({ inscripcionId }) => {
    try {
      // 1. Buscamos la inscripción directamente por su ID único
      const inscripcion = await prisma.inscripciones.findUnique({
        where: { id_ins: inscripcionId },
        include: { usuarios: true, eventos: true },
      });

      if (!inscripcion) {
        return { success: false, error: { message: 'No se encontró un certificado con este código.' } };
      }
      
      // 2. Realizamos la misma validación de requisitos
      const asistenciaNum = inscripcion.asi_par ?? 0;
      const calificacionNum = (inscripcion.not_par as any)?.toNumber() ?? 0.0;
      if (inscripcion.est_par !== 'APROBADA' || asistenciaNum < 70 || calificacionNum < 7.0) {
        return { success: false, error: { message: 'El participante no cumple los requisitos para la emisión.' } };
      }

      // 3. Generamos el PDF (misma lógica que tu otra action)
      const pdfBytes = await generarCertificadoPDF({
        nombreUsuario: `${inscripcion.usuarios.nom_usu1} ${inscripcion.usuarios.nom_usu2 ?? ''} ${inscripcion.usuarios.ape_usu1} ${inscripcion.usuarios.ape_usu2 ?? ''}`.trim(),
        nombreCurso: inscripcion.eventos.nom_eve,
        fechaInicio: inscripcion.eventos.fec_ini_eve.toLocaleDateString('es-EC', { day: 'numeric', month: 'long' }),
        fechaFin: (inscripcion.eventos.fec_fin_eve ?? inscripcion.eventos.fec_ini_eve).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' }),
        duracionHoras: inscripcion.eventos.dur_eve?.toString() ?? '40',
        fechaGeneracion: (inscripcion.fec_cer_par ?? new Date()).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' }),
      });

      const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

      return {
        success: true,
        data: {
          pdfBase64,
          fileName: `certificado-${inscripcion.eventos.nom_eve}.pdf`,
        },
      };

    } catch (error: any) {
      console.error('Error en generarCertificadoPublico:', error);
      return { success: false, error: { message: 'Error interno del servidor.' } };
    }
  },
});