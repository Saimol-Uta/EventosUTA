import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';
import { ImageUpload } from '../../utils/image-upload';
import { Prisma } from '@prisma/client';

const MAX_FILE_SIZE = 1024 * 1024 * 10; // 10MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml'];

// Helper para validar archivos opcionales
const optionalFileSchema = (fieldName: string) => z.instanceof(File)
    .refine((file) => {
        // Si el archivo está vacío (sin nombre), lo consideramos válido
        if (!file.name || file.size === 0) return true;
        return file.size <= MAX_FILE_SIZE;
    }, `${fieldName} no debe superar 10MB`)
    .refine((file) => {
        // Si el archivo está vacío (sin nombre), lo consideramos válido
        if (!file.name || file.size === 0) return true;
        return ACCEPTED_FILE_TYPES.includes(file.type);
    }, `Solo se permiten archivos: ${ACCEPTED_FILE_TYPES.join(', ')}`)
    .optional();

export const CreateUpdatePaginaFacultad = defineAction({
    accept: 'form',
    input: z.object({
        // ID para identificar si es crear o actualizar
        id_facultad: z.string().uuid().optional(),

        // Información básica
        nombre_facultad: z.string().min(1, 'El nombre de la facultad es requerido'),

        // Logo
        logo_facultad: optionalFileSchema('El logo'),

        // Carrusel - Imagen 1
        titulo_carrusel_1: z.string().min(1, 'El título del carrusel 1 es requerido'),
        descripcion_carrusel_1: z.string().optional(),
        imagen_carrusel_1: optionalFileSchema('La imagen del carrusel 1'),

        // Carrusel - Imagen 2
        titulo_carrusel_2: z.string().min(1, 'El título del carrusel 2 es requerido'),
        descripcion_carrusel_2: z.string().optional(),
        imagen_carrusel_2: optionalFileSchema('La imagen del carrusel 2'),

        // Carrusel - Imagen 3
        titulo_carrusel_3: z.string().min(1, 'El título del carrusel 3 es requerido'),
        descripcion_carrusel_3: z.string().optional(),
        imagen_carrusel_3: optionalFileSchema('La imagen del carrusel 3'),

        // Equipo Académico
        nombre_decano: z.string().optional(),
        imagen_decano: optionalFileSchema('La imagen del decano'),

        nombre_subdecano: z.string().optional(),
        imagen_subdecano: optionalFileSchema('La imagen del subdecano'),

        nombre_responsable: z.string().optional(),
        imagen_responsable: optionalFileSchema('La imagen del responsable'),

        // Misión y Visión
        mision: z.string().optional(),
        imagen_mision: optionalFileSchema('La imagen de misión'),

        vision: z.string().optional(),
        imagen_vision: optionalFileSchema('La imagen de visión'),

        // Información de contacto
        direccion_contacto: z.string().optional(),
        correo_contacto: z.string().email('Debe ser un email válido').optional(),
        facebook: z.string().optional(),
        twitter: z.string().optional(),
        instagram: z.string().optional(),
        link_jira: z.string().url('Debe ser una URL válida').optional(),

        // Eventos destacados (opcional)
        eventos_destacados: z.array(z.string().uuid()).optional(),
    }), handler: async (form, { request }) => {
        try {
            const isUpdate = !!form.id_facultad;

            // Si es actualización, verificar que la facultad existe
            if (isUpdate) {
                const facultadExistente = await prisma.facultades.findUnique({
                    where: { id_fac: form.id_facultad }
                });

                if (!facultadExistente) {
                    return {
                        success: false,
                        message: 'La facultad especificada no existe'
                    };
                }
            }

            // Función helper para subir imágenes
            const uploadImage = async (file: File | undefined, existingUrl?: string): Promise<string> => {
                // Solo procesar si el archivo existe, tiene contenido y tiene nombre
                if (file && file.size > 0 && file.name) {
                    try {
                        return await ImageUpload.upload(file);
                    } catch (cloudinaryError: any) {
                        console.error('Error de Cloudinary:', cloudinaryError);
                        throw new Error('Error al subir imagen: Verifica la configuración de Cloudinary');
                    }
                }
                return existingUrl || '';
            };

            // Obtener URLs existentes si es actualización
            let existingData: any = {};
            if (isUpdate) {
                existingData = await prisma.facultades.findUnique({
                    where: { id_fac: form.id_facultad }
                });
            }

            // Procesar todas las imágenes
            const [
                logo_url,
                imagen_carrusel_1_url,
                imagen_carrusel_2_url,
                imagen_carrusel_3_url,
                imagen_decano_url,
                imagen_subdecano_url,
                imagen_responsable_url,
                imagen_mision_url,
                imagen_vision_url
            ] = await Promise.all([
                uploadImage(form.logo_facultad, existingData.img_log),
                uploadImage(form.imagen_carrusel_1, existingData.img_caru1),
                uploadImage(form.imagen_carrusel_2, existingData.img_caru2),
                uploadImage(form.imagen_carrusel_3, existingData.img_caru3),
                uploadImage(form.imagen_decano, existingData.dec_img),
                uploadImage(form.imagen_subdecano, existingData.sub_img),
                uploadImage(form.imagen_responsable, existingData.res_img),
                uploadImage(form.imagen_mision, existingData.img_mis),
                uploadImage(form.imagen_vision, existingData.img_vis)
            ]);

            // Preparar datos para crear/actualizar
            const facultadData = {
                nom_fac: form.nombre_facultad,
                img_log: logo_url,

                // Carrusel
                tit_caru1: form.titulo_carrusel_1,
                des_caru1: form.descripcion_carrusel_1 || '',
                img_caru1: imagen_carrusel_1_url,
                tit_caru2: form.titulo_carrusel_2,
                des_caru2: form.descripcion_carrusel_2 || '',
                img_caru2: imagen_carrusel_2_url,
                tit_caru3: form.titulo_carrusel_3,
                des_caru3: form.descripcion_carrusel_3 || '',
                img_caru3: imagen_carrusel_3_url,

                // Equipo académico
                dec_fac: form.nombre_decano || '',
                dec_img: imagen_decano_url,
                sub_fac: form.nombre_subdecano || '',
                sub_img: imagen_subdecano_url,
                res_fac: form.nombre_responsable || '',
                res_img: imagen_responsable_url,

                // Misión y visión
                mis_fac: form.mision || '',
                img_mis: imagen_mision_url,
                vis_fac: form.vision || '',
                img_vis: imagen_vision_url,

                // Contacto
                dir_fac: form.direccion_contacto || '',
                cor_fac: form.correo_contacto || '',
                face_fac: form.facebook || '',
                twit_fac: form.twitter || '',
                inst_fac: form.instagram || '',
                enl_sol: form.link_jira || '',
            };

            let resultado;

            if (isUpdate) {
                // Actualizar facultad existente
                resultado = await prisma.facultades.update({
                    where: { id_fac: form.id_facultad },
                    data: facultadData
                });

                return {
                    success: true,
                    message: 'Facultad actualizada correctamente',
                    data: {
                        id: resultado.id_fac,
                        nombre: resultado.nom_fac,
                        operacion: 'actualizar'
                    }
                };
            } else {
                // Crear nueva facultad
                resultado = await prisma.facultades.create({
                    data: facultadData
                });

                return {
                    success: true,
                    message: 'Facultad creada correctamente',
                    data: {
                        id: resultado.id_fac,
                        nombre: resultado.nom_fac,
                        operacion: 'crear'
                    }
                };
            }
        } catch (error: any) {
            console.error('Error en CreateUpdatePaginaFacultad:', error);

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    const target = error.meta?.target;
                    const targetFields = Array.isArray(target) ? target : [target].filter(Boolean);

                    return {
                        success: false,
                        message: `Ya existe una facultad con: ${targetFields.join(', ')}`,
                        error: { code: error.code, details: error.meta }
                    };
                }
            }

            // Otros errores
            console.error('Error inesperado al crear/actualizar facultad:', error);
            return {
                success: false,
                message: error.message || 'Ocurrió un error inesperado al procesar la facultad.',
                error: {
                    code: error.code || 'UNKNOWN_ERROR',
                    type: error.constructor?.name || 'Error'
                }
            };
        }
    }
});