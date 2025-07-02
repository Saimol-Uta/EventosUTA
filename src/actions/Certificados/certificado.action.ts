import { defineAction } from 'astro:actions';
import { getSession } from 'auth-astro/server';
import prisma from '../../db';
import { generarCertificadoPDF } from './generateCertificado';
import { z } from 'zod';
import type { Decimal } from '@prisma/client/runtime/library';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import type { UploadApiResponse } from 'cloudinary';

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: import.meta.env.CLOUDINARY_CLOUD_NAME,
  api_key: import.meta.env.CLOUDINARY_API_KEY,
  api_secret: import.meta.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Función de ayuda para subir el archivo a Cloudinary
async function uploadToCloudinary(pdfBytes: Uint8Array, publicId: string): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { public_id: publicId, folder: 'certificados', resource_type: 'raw', overwrite: true },
      (error, result) => {
        if (error) return reject(error);
        if (result) resolve(result);
      }
    );
    Readable.from(Buffer.from(pdfBytes)).pipe(uploadStream);
  });
}

export const GenerarCertificado = defineAction({
  input: z.object({
    eventoId: z.string().uuid({ message: 'ID de evento inválido.' }),
  }),
  handler: async ({ eventoId }, context) => {
    try {
      const session = await getSession(context.request);
      if (!session?.user?.id) return { success: false, error: { message: 'Usuario no autenticado.' } };

      const userId = session.user.id;
      const inscripcion = await prisma.inscripciones.findFirst({
        where: { id_usu_ins: userId, id_eve_ins: eventoId },
        include: { usuarios: true, eventos: true },
      });

      if (!inscripcion) {
        return { success: false, error: { message: 'Inscripción no encontrada.' } };
      }

      //LÓGICA DE CACHÉ
      if (inscripcion.enl_cer_par) {
        console.log("Recuperando PDF existente desde Cloudinary...");

        // Descargamos el PDF desde la URL guardada
        const response = await fetch(inscripcion.enl_cer_par);
        if (!response.ok) throw new Error('No se pudo recuperar el certificado existente desde el enlace.');

        // Lo convertimos a base64 y lo devolvemos
        const buffer = await response.arrayBuffer();
        const pdfBase64 = Buffer.from(buffer).toString('base64');
        return {
          success: true,
          data: {
            pdfBase64,
            fileName: `certificado-${inscripcion.eventos.nom_eve}.pdf`,
          },
        };
      }

      // Generacion del Certificado
      const esElegible = (inscripcion.asi_par ?? 0) >= 70 && ((inscripcion.not_par as Decimal)?.toNumber() ?? 0.0) >= 7.0 && inscripcion.est_par === 'APROBADA';
      if (!esElegible) {
        return { success: false, error: { message: 'No cumples los requisitos para generar este certificado.' } };
      }

      const fechaParaElCertificado = inscripcion.fec_cer_par ?? new Date();

      const pdfBytes = await generarCertificadoPDF({
        nombreUsuario: `${inscripcion.usuarios.nom_usu1} ${inscripcion.usuarios.nom_usu2 ?? ''} ${inscripcion.usuarios.ape_usu1} ${inscripcion.usuarios.ape_usu2 ?? ''}`.trim(),
        nombreCurso: inscripcion.eventos.nom_eve,
        fechaInicio: inscripcion.eventos.fec_ini_eve.toLocaleDateString('es-EC', { day: 'numeric', month: 'long' }),
        fechaFin: (inscripcion.eventos.fec_fin_eve ?? inscripcion.eventos.fec_ini_eve).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' }),
        duracionHoras: inscripcion.eventos.dur_eve?.toString() ?? '40',
        fechaGeneracion: fechaParaElCertificado.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' }),
        nota: inscripcion.not_par?.toNumber() ?? 0,
        asistencia: inscripcion.asi_par ?? 0
      });

      const uploadResult = await uploadToCloudinary(pdfBytes, inscripcion.id_ins);
      const fileUrl = uploadResult.secure_url;
      if (!fileUrl) throw new Error("La subida a Cloudinary no devolvió una URL.");

      await prisma.inscripciones.update({
        where: { id_ins: inscripcion.id_ins },
        data: {
          enl_cer_par: fileUrl,
          fec_cer_par: fechaParaElCertificado,
        },
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
      console.error('Error al generar certificado:', error);
      return { success: false, error: { message: 'Error interno del servidor.' } };
    }
  },
});

export const generarCertificadoPublico = defineAction({
  input: z.object({
    inscripcionId: z.string().uuid({ message: "El formato del código no es válido." }),
  }),

  // No necesita 'context' porque no hay sesión
  handler: async ({ inscripcionId }) => {
    try {
      // Buscamos la inscripción directamente por su ID único
      const inscripcion = await prisma.inscripciones.findUnique({
        where: { id_ins: inscripcionId },
        include: { usuarios: true, eventos: true },
      });

      if (!inscripcion) {
        return { success: false, error: { message: 'No se encontró un certificado con este código.' } };
      }
      
      // Validamos los requisitos (nota, asistencia, estado)
      const asistenciaNum = inscripcion.asi_par ?? 0;
      const calificacionNum = (inscripcion.not_par as any)?.toNumber() ?? 0.0;
      if (inscripcion.est_par !== 'APROBADA' || asistenciaNum < 70 || calificacionNum < 7.0) {
        return { success: false, error: { message: 'El participante no cumple los requisitos para la emisión.' } };
      }

      // --- LÓGICA DE CACHÉ Y GENERACIÓN (IDÉNTICA A LA ACTION PRIVADA) ---

      // CASO 2: Si el enlace ya existe, lo recuperamos de Cloudinary.
      if (inscripcion.enl_cer_par) {
        console.log("Recuperando PDF existente desde Cloudinary (Público)...");
        const response = await fetch(inscripcion.enl_cer_par);
        if (!response.ok) throw new Error('No se pudo recuperar el certificado existente.');
        
        const buffer = await response.arrayBuffer();
        const pdfBase64 = Buffer.from(buffer).toString('base64');
        return {
          success: true,
          data: {
            pdfBase64,
            fileName: `certificado-${inscripcion.eventos.nom_eve}.pdf`,
          },
        };
      }

      // CASO 1 y 3: Si no hay enlace, lo generamos.
      console.log("Generando nuevo certificado (Público)...");
      const fechaParaElCertificado = inscripcion.fec_cer_par ?? new Date();

      const pdfBytes = await generarCertificadoPDF({
        nombreUsuario: `${inscripcion.usuarios.nom_usu1} ${inscripcion.usuarios.nom_usu2 ?? ''} ${inscripcion.usuarios.ape_usu1} ${inscripcion.usuarios.ape_usu2 ?? ''}`.trim(),
        nombreCurso: inscripcion.eventos.nom_eve,
        fechaInicio: inscripcion.eventos.fec_ini_eve.toLocaleDateString('es-EC', { day: 'numeric', month: 'long' }),
        fechaFin: (inscripcion.eventos.fec_fin_eve ?? inscripcion.eventos.fec_ini_eve).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' }),
        duracionHoras: inscripcion.eventos.dur_eve?.toString() ?? '40',
        fechaGeneracion: fechaParaElCertificado.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' }),
        nota: inscripcion.not_par?.toNumber() ?? 0,
        asistencia: inscripcion.asi_par ?? 0
      });
      
      const uploadResult = await uploadToCloudinary(pdfBytes, inscripcion.id_ins);
      const fileUrl = uploadResult.secure_url;
      if (!fileUrl) throw new Error("La subida a Cloudinary no devolvió una URL.");

      await prisma.inscripciones.update({
        where: { id_ins: inscripcion.id_ins },
        data: {
          enl_cer_par: fileUrl,
          fec_cer_par: fechaParaElCertificado,
        },
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

export const recuperarCertificadoDesdeUrl = defineAction({
  input: z.object({
    url: z.string().url({ message: "La URL proporcionada no es válida." }),
  }),
  handler: async ({ url }, context) => {
    const session = await getSession(context.request);
    if (!session?.user?.id) {
      return { success: false, error: { message: "Acceso no autorizado." } };
    }

    try {
      console.log(`Recuperando PDF desde la URL: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('No se pudo recuperar el archivo desde el enlace.');
      }
      
      const buffer = await response.arrayBuffer();
      const pdfBase64 = Buffer.from(buffer).toString('base64');
      
      const fileName = url.split('/').pop() || 'certificado.pdf';

      return {
        success: true,
        data: {
          pdfBase64,
          fileName,
        },
      };

    } catch (error: any) {
      console.error("Error al recuperar certificado desde URL:", error);
      return { success: false, error: { message: error.message || "Error interno del servidor." } };
    }
  },
});