import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';
import { ImageUpload } from '../../utils/image-upload';
import { Prisma } from '@prisma/client';

const MAX_FILE_SIZE = 1024 * 1024 * 10; // 10MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml'];

export const crearEvento = defineAction({
    accept: 'form',
    input: z.object({
        nombre: z.string().min(1),
        descripcion: z.string().min(1),
        categoria: z.string().uuid(),
        area: z.enum(['PRACTICA', 'INVESTIGACION', 'ACADEMICA', 'TECNICA', 'INDUSTRIAL', 'EMPRESARIAL', 'IA', 'REDES']).optional(),
        precio: z.coerce.number().min(0),
        fecha_inicio: z.string().transform(str => new Date(str)),
        fecha_fin: z.string().optional().transform(str => str && str !== '' ? new Date(str) : undefined),
        duracion: z.coerce.number().optional(),
        ubicacion: z.string().min(1),
        cedula_organizador: z.string().min(10).max(10),
        imagen: z.instanceof(File).refine((file) => file.size <= MAX_FILE_SIZE, 'MAX IMAGE SIZE 10MB')
            .refine((file) => {
                return ACCEPTED_FILE_TYPES.includes(file.type);
            }, `only ${ACCEPTED_FILE_TYPES.join(', ')}`).optional(),
        es_gratuito: z.coerce.boolean().optional(),
        requiere_carta: z.coerce.boolean().optional(),
        es_destacado: z.coerce.boolean().optional(),
        carta_motivacion: z.string().optional(),
        fecha_inicio_inscripcion: z.string().transform(str => new Date(str)),
        fecha_fin_inscripcion: z.string().transform(str => new Date(str)),
        asignacion_id: z.string().uuid().optional(),
    }),
    handler: async (form, { request }) => {
        try {
            // 1. Verificar que el organizador existe
            const organizador = await prisma.organizadores.findUnique({
                where: { ced_org: form.cedula_organizador }
            });

            if (!organizador) {
                return {
                    success: false,
                    message: 'El organizador no existe en el sistema'
                };
            }

            // 2. Verificar que la categoría existe
            const categoria = await prisma.categorias_eventos.findUnique({
                where: { id_cat: form.categoria }
            });

            if (!categoria) {
                return {
                    success: false,
                    message: 'La categoría especificada no existe'
                };
            }

            // 3. Verificar que la asignación existe (si se proporciona)
            if (form.asignacion_id) {
                const asignacion = await prisma.asignaciones.findUnique({
                    where: { id_asi: form.asignacion_id }
                });

                if (!asignacion) {
                    return {
                        success: false,
                        message: 'La asignación especificada no existe'
                    };
                }
            }

            // 4. Procesar imagen si existe
            let imagen_url = '';
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

            // 5. Crear el evento
            const nuevoEvento = await prisma.eventos.create({
                data: {
                    nom_eve: form.nombre,
                    des_eve: form.descripcion,
                    id_cat_eve: form.categoria,
                    fec_ini_eve: form.fecha_inicio,
                    fec_fin_eve: form.fecha_fin,
                    fec_ini_ins_eve: form.fecha_inicio_inscripcion,
                    fec_fin_ins_eve: form.fecha_fin_inscripcion,
                    dur_eve: form.duracion,
                    are_eve: form.area,
                    ubi_eve: form.ubicacion,
                    ced_org_eve: form.cedula_organizador,
                    img_eve: imagen_url,
                    precio: form.precio,
                    es_gratuito: form.es_gratuito ?? false,
                    requiere_carta: form.requiere_carta ?? false,
                    es_destacado: form.es_destacado ?? false,
                    car_mot_eve: form.carta_motivacion,
                    id_asi_eve: form.asignacion_id,
                }
            });

            return {
                success: true,
                message: 'Evento creado correctamente',
                data: {
                    id: nuevoEvento.id_eve.toString(),
                    nombre: nuevoEvento.nom_eve,
                    categoria: nuevoEvento.id_cat_eve,
                    imagen_url: imagen_url
                }
            };

        } catch (error: any) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    // Verificar si `meta?.target` existe y es un array o cadena
                    const target = error.meta?.target;

                    // Convertir `target` en un array si es necesario
                    const targetFields = Array.isArray(target) ? target : [target].filter(Boolean);

                    return {
                        success: false,
                        message: `Violación de unicidad en: ${targetFields.join(', ')}`,
                        error: { code: error.code, details: error.meta }
                    };
                }
            }

            // Otros errores
            console.error('Error inesperado al crear evento:', error);
            return {
                success: false,
                message: 'Ocurrió un error inesperado al crear el evento.',
                error: {
                    code: error.code || 'UNKNOWN_ERROR',
                    type: error.constructor?.name || 'Error'
                }
            };
        }
    }
});
