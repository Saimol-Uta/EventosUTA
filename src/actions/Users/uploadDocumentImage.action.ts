import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';
import { ImageUpload } from '../../utils/image-upload';


const MAX_FILE_SIZE = 1024 * 1024 * 5; // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

export const uploadDocumentImage = defineAction({
    accept: 'form',
    input: z.object({
        cuentaId: z.string().min(1, "ID de usuario es requerido"),
        fieldName: z.string().min(1, 'Nombre del campo es requerido'),
        imagen: z.instanceof(File)
            .refine((file) => file.size <= MAX_FILE_SIZE, 'El tamaño máximo de imagen es 5MB')
            .refine((file) => {
                return ACCEPTED_FILE_TYPES.includes(file.type);
            }, `Solo se permiten archivos: ${ACCEPTED_FILE_TYPES.join(', ')}`)
    }),
    handler: async (form) => {
        try {
            // Verificar que el usuario existe
            const usuario = await prisma.usuarios.findUnique({
                where: { cor_cue: form.cuentaId },

                select: {
                    cor_cue: true,
                    nom_usu1: true,
                    ape_usu1: true,
                    enl_ced_cue: true,
                    enl_mat_cue: true,
                },
            });

            if (!usuario) {
                return {
                    success: false,
                    message: "Usuario no encontrado",
                };
            }

            // Subir imagen a Cloudinary
            let imagen_url = '';
            try {
                imagen_url = await ImageUpload.upload(form.imagen);
            } catch (cloudinaryError: any) {
                console.error('Error de Cloudinary:', cloudinaryError);
                return {
                    success: false,
                    message: 'Error al subir la imagen: Verifica la configuración de Cloudinary'
                };
            }

            // Eliminar imagen anterior si existe
            const currentImageField = form.fieldName.toLowerCase();
            let currentImageUrl = '';

            if (currentImageField === "enl_ced_cue") {
                currentImageUrl = usuario.enl_ced_cue || "";
            } else if (currentImageField === "enl_mat_cue") {
                currentImageUrl = usuario.enl_mat_cue || "";
            }

            if (currentImageUrl) {
                try {
                    await ImageUpload.delete(currentImageUrl);
                    console.log('Imagen anterior eliminada:', currentImageUrl);
                } catch (deleteError: any) {
                    console.warn('No se pudo eliminar la imagen anterior:', deleteError);
                }
            }

            // Preparar datos para actualizar según el campo
            let updateData: any = {};
            if (currentImageField === 'enl_ced_cue') {
                updateData.enl_ced_cue = imagen_url;
            } else if (currentImageField === 'enl_mat_cue') {
                updateData.enl_mat_cue = imagen_url;
            } else if (currentImageField === 'enl_ext_cue') {
                updateData.enl_ext_cue = imagen_url;
            } else {
                return {
                    success: false,
                    message: 'Campo no válido para actualización'
                };
            }

            // Actualizar el campo correspondiente
            const usuarioActualizado = await prisma.usuarios.update({
                where: { cor_cue: form.cuentaId },
                data: updateData,
                // Seleccionamos los campos actualizados directamente.
                select: {
                    cor_cue: true,
                    nom_usu1: true,
                    ape_usu1: true,
                    enl_ced_cue: true,
                    enl_mat_cue: true,
                },
            });

            return {
                success: true,
                message: "Imagen de documento actualizada exitosamente",
                data: {
                    id_usuario: usuarioActualizado.cor_cue,
                    campo_actualizado: form.fieldName,
                    imagen_url: imagen_url,
                    nombre_usuario: `${usuarioActualizado.nom_usu1} ${usuarioActualizado.ape_usu1}`,
                },
            };

        } catch (error: any) {
            console.error('Error inesperado al actualizar imagen de documento:', error);
            return {
                success: false,
                message: 'Ocurrió un error inesperado al actualizar la imagen',
                error: {
                    code: error.code || 'UNKNOWN_ERROR',
                    type: error.constructor?.name || 'Error'
                }
            };
        }
    }
});