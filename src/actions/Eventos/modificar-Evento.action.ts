import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';
import { ImageUpload } from '../../utils/image-upload';
import { Prisma } from '@prisma/client';

const MAX_FILE_SIZE = 1024 * 1024 * 10; // 10MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml'];


export const modificarEvento = defineAction({
    accept: 'form',
    input: z.object({
        evento_id: z.string().uuid(),
        nombre: z.string().min(1),
        descripcion: z.string().min(1),
        categoria: z.string().uuid(),
        area: z.enum(['PRACTICA', 'INVESTIGACION', 'ACADEMICA', 'TECNICA', 'INDUSTRIAL', 'EMPRESARIAL', 'IA', 'REDES']).optional(),
        precio: z.coerce.number().min(0),
        fecha_inicio: z.string().transform(str => new Date(str)),
        hora_inicio: z.string(),
        fecha_fin: z.string().optional().transform(str => str && str !== '' ? new Date(str) : undefined),
        hora_fin: z.string().optional().transform(str => str && str !== '' ? str : undefined),
        duracion: z.coerce.number().optional(),
        ubicacion: z.string().min(1),
        cedula_organizador: z.string().min(10).max(10),
        imagen: z.instanceof(File).refine((file) => file.size <= MAX_FILE_SIZE, 'MAX IMAGE SIZE 10MB')
            .refine((file) => {
                return ACCEPTED_FILE_TYPES.includes(file.type);
            }, `only ${ACCEPTED_FILE_TYPES.join(', ')}`).optional(),
        nota_aprobacion: z.coerce.number().min(0).max(10).optional(),
        tiempo_registro_asignacion: z.coerce.boolean().optional(),
    }),
    handler: async (form, { request }) => {
        try {
            // 1. Verificar que el evento existe
            const eventoExistente = await prisma.eventos.findUnique({
                where: { id_eve: form.evento_id }
            });

            if (!eventoExistente) {
                return {
                    success: false,
                    message: 'El evento no existe'
                };
            }

            // 2. Verificar que el organizador existe
            const organizador = await prisma.organizadores.findUnique({
                where: { ced_org: form.cedula_organizador }
            });

            if (!organizador) {
                return {
                    success: false,
                    message: 'El organizador no existe en el sistema'
                };
            }

            // 3. Verificar que la categoría existe
            const categoria = await prisma.categorias_eventos.findUnique({
                where: { id_cat: form.categoria }
            });

            if (!categoria) {
                return {
                    success: false,
                    message: 'La categoría especificada no existe'
                };
            }

            // 4. Procesar imagen si existe
            let imagen_url = eventoExistente.img_eve; // Mantener imagen existente por defecto
            console.log(form.imagen);

            if (form.imagen && form.imagen.size > 0) {
                try {
                    imagen_url = await ImageUpload.upload(form.imagen);
                } catch (cloudinaryError: any) {
                    console.error('Error de Cloudinary:', cloudinaryError);
                    return {
                        success: false,
                        message: 'Error al subir la imagen: Verifica la configuración de Cloudinary'
                    };
                }
            }

            // 5. Actualizar el evento
            const eventoActualizado = await prisma.eventos.update({
                where: { id_eve: form.evento_id },
                data: {
                    nom_eve: form.nombre,
                    des_eve: form.descripcion,
                    id_cat_eve: form.categoria,
                    fec_ini_eve: form.fecha_inicio,
                    fec_fin_eve: form.fecha_fin,
                    hor_ini_eve: new Date(`1970-01-01T${form.hora_inicio}:00`),
                    hor_fin_eve: form.hora_fin ? new Date(`1970-01-01T${form.hora_fin}:00`) : undefined,
                    dur_eve: form.duracion,
                    are_eve: form.area,
                    ubi_eve: form.ubicacion,
                    ced_org_eve: form.cedula_organizador,
                    img_eve: imagen_url,
                    precio: form.precio,
                    not_apr_eve: form.nota_aprobacion || 7.0,
                    tie_reg_asi: form.tiempo_registro_asignacion ?? true
                }
            });

            return {
                success: true,
                message: 'Evento actualizado correctamente',
                data: {
                    id: eventoActualizado.id_eve.toString(),
                    nombre: eventoActualizado.nom_eve,
                    categoria: eventoActualizado.id_cat_eve,
                    imagen_url: imagen_url
                }
            };

        } catch (error: any) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    const target = error.meta?.target;
                    const targetFields = Array.isArray(target) ? target : [target].filter(Boolean);

                    return {
                        success: false,
                        message: `Violación de unicidad en: ${targetFields.join(', ')}`,
                        error: { code: error.code, details: error.meta }
                    };
                }
            }

            console.error('Error inesperado al modificar evento:', error);
            return {
                success: false,
                message: 'Ocurrió un error inesperado al modificar el evento.',
                error: {
                    code: error.code || 'UNKNOWN_ERROR',
                    type: error.constructor?.name || 'Error'
                }
            };
        }
    }
});