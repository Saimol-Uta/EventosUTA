import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';
import { PdfUpload } from '../../utils/PdfUpload'; // ✅ CAMBIO: Usamos la nueva utilidad

const MAX_FILE_SIZE_PDF = 10 * 1024 * 1024; // 10MB para PDFs
const ACCEPTED_FILE_TYPE_PDF = 'application/pdf';

export const uploadDocumentPdf = defineAction({
    accept: 'form',
    input: z.object({
        cuentaId: z.string().min(1, 'ID de usuario es requerido'),
        fieldName: z.string().min(1, 'Nombre del campo es requerido'),
        // ✅ CAMBIO: El campo ahora se llama 'pdf' y valida el tipo correcto
        pdf: z.instanceof(File)
            .refine((file) => file.size <= MAX_FILE_SIZE_PDF, 'El tamaño máximo del PDF es 10MB')
            .refine(
                (file) => file.type === ACCEPTED_FILE_TYPE_PDF,
                'Solo se permiten archivos en formato PDF.'
            )
    }),
    handler: async (form) => {
        try {
            const usuario = await prisma.usuarios.findUnique({
                where: { cor_cue: form.cuentaId },
                select: { enl_ced_cue: true, enl_mat_cue: true },
            });

            if (!usuario) {
                return { success: false, message: 'Usuario no encontrado' };
            }

            // Crear un public_id único para el archivo
            const fileName = form.fieldName.replace('enl_', '').replace('_cue', ''); // ced, mat
            const publicId = `${fileName}_${form.cuentaId.replace(/[@.]/g, '_')}`; // ced_usuario_email_com

            // Subir el nuevo PDF
            const pdf_url = await PdfUpload.upload(form.pdf, publicId);

            // Eliminar PDF anterior si existe
            const currentPdfField = form.fieldName as keyof typeof usuario;
            const currentPdfUrl = usuario[currentPdfField];
            
            if (currentPdfUrl) {
                await PdfUpload.delete(currentPdfUrl);
            }

            // Actualizar la base de datos
            await prisma.usuarios.update({
                where: { cor_cue: form.cuentaId },
                data: { [form.fieldName]: pdf_url },
            });

            return {
                success: true,
                message: 'PDF subido exitosamente',
                data: { pdf_url: pdf_url },
            };

        } catch (error: any) {
            console.error("Error al subir PDF:", error);
            return {
                success: false,
                message: error.message || 'Error inesperado al procesar el PDF.',
            };
        }
    }
});