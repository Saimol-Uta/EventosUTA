import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';
import { ImageUpload } from '../../utils/image-upload';
import { Prisma } from '@prisma/client';

const MAX_FILE_SIZE = 1024 * 1024 * 5; // 5MB para imágenes de perfil
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

export const uploadImageUser = defineAction({
    accept: 'form',
    input: z.object({
        cor_cue: z.string(),
        imagen: z.instanceof(File)
            .refine((file) => file.size <= MAX_FILE_SIZE, 'El tamaño máximo de imagen es 5MB')
            .refine((file) => {
                return ACCEPTED_FILE_TYPES.includes(file.type);
            }, `Solo se permiten archivos: ${ACCEPTED_FILE_TYPES.join(', ')}`)
    }),
    handler: async (form) => {
        try {
            console.log('Iniciando actualización de imagen de usuario:', form.cor_cue);

            const usuario = await prisma.usuarios.findUnique({
                where: { cor_cue: form.cor_cue },
                select: {
                    cor_cue: true,
                    img_user: true,
                    nom_usu1: true,
                    ape_usu1: true
                }
            });

            if (!usuario) {
                return {
                    success: false,
                    message: 'Usuario no encontrado'
                };
            }

            // Subir nueva imagen a Cloudinary
            let nueva_imagen_url = '';
            try {
                nueva_imagen_url = await ImageUpload.upload(form.imagen);
            } catch (cloudinaryError: any) {
                console.error('Error de Cloudinary:', cloudinaryError);
                return {
                    success: false,
                    message: 'Error al subir la imagen: Verifica la configuración de Cloudinary'
                };
            }

            // Eliminar imagen anterior si existe
            if (usuario.img_user) {
                try {
                    await ImageUpload.delete(usuario.img_user);
                    console.log('Imagen anterior eliminada:', usuario.img_user);
                } catch (deleteError: any) {
                    console.warn('No se pudo eliminar la imagen anterior:', deleteError);
                }
            }

            // Actualizar la imagen del usuario
            const usuarioActualizado = await prisma.usuarios.update({
                where: { cor_cue: usuario.cor_cue },
                data: { img_user: nueva_imagen_url },
                select: {
                    cor_cue: true,
                    img_user: true,
                    nom_usu1: true,
                    ape_usu1: true
                }
            });

            return {
                success: true,
                message: 'Imagen de perfil actualizada exitosamente',
                data: {
                    correo: usuarioActualizado.cor_cue,
                    imagen_url: usuarioActualizado.img_user,
                    nombre_usuario: `${usuarioActualizado.nom_usu1} ${usuarioActualizado.ape_usu1}`
                }
            };

        } catch (error: any) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    return {
                        success: false,
                        message: 'No se encontró el usuario para actualizar',
                        error: { code: error.code, details: error.meta }
                    };
                }
            }

            console.error('Error inesperado al actualizar imagen de usuario:', error);
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