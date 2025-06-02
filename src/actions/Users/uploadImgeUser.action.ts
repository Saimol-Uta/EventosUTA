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
        cuentaId: z.string().uuid('ID de cuenta inválido'),
        imagen: z.instanceof(File)
            .refine((file) => file.size <= MAX_FILE_SIZE, 'El tamaño máximo de imagen es 5MB')
            .refine((file) => {
                return ACCEPTED_FILE_TYPES.includes(file.type);
            }, `Solo se permiten archivos: ${ACCEPTED_FILE_TYPES.join(', ')}`)
    }),
    handler: async (form) => {
        try {
            // Verificar que la cuenta existe y obtener imagen anterior
            const cuenta = await prisma.cuentas.findUnique({
                where: { id_cue: form.cuentaId },
                select: {
                    img_user: true,
                    usuarios: {
                        select: {
                            nom_usu1: true,
                            ape_usu1: true
                        }
                    }
                }
            });

            if (!cuenta) {
                return {
                    success: false,
                    message: 'Cuenta no encontrada'
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
            if (cuenta.img_user) {
                try {
                    await ImageUpload.delete(cuenta.img_user);
                    console.log('Imagen anterior eliminada:', cuenta.img_user);
                } catch (deleteError: any) {
                    console.warn('No se pudo eliminar la imagen anterior:', deleteError);
                    // No fallar la operación si no se puede eliminar la imagen anterior
                }
            }

            // Actualizar la imagen del usuario en la cuenta
            const cuentaActualizada = await prisma.cuentas.update({
                where: { id_cue: form.cuentaId },
                data: { img_user: nueva_imagen_url },
                select: {
                    id_cue: true,
                    cor_cue: true,
                    img_user: true,
                    usuarios: {
                        select: {
                            nom_usu1: true,
                            ape_usu1: true
                        }
                    }
                }
            });

            return {
                success: true,
                message: 'Imagen de perfil actualizada exitosamente',
                data: {
                    id_cuenta: cuentaActualizada.id_cue,
                    correo: cuentaActualizada.cor_cue,
                    imagen_url: cuentaActualizada.img_user,
                    nombre_usuario: `${cuentaActualizada.usuarios.nom_usu1} ${cuentaActualizada.usuarios.ape_usu1}`
                }
            };

        } catch (error: any) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    return {
                        success: false,
                        message: 'No se encontró la cuenta para actualizar',
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