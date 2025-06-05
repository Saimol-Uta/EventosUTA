import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

const MAX_FILE_SIZE = 1024 * 1024 * 5; // 5MB para imágenes de perfil
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

export const crearEvento = defineAction({
    accept: 'json', input: z.object({
        nombre: z.string().min(1),
        descripcion: z.string().min(1),
        categoria: z.string().uuid(), // Ahora esperamos un UUID de categoría
        area: z.enum(['PRACTICA', 'INVESTIGACION', 'ACADEMICA', 'TECNICA', 'INDUSTRIAL', 'EMPRESARIAL', 'IA', 'REDES']).optional(),
        precio: z.number().min(0),
        fecha_inicio: z.string().transform(str => new Date(str)),
        hora_inicio: z.string(),
        fecha_fin: z.string().nullable().optional().transform(str => str ? new Date(str) : undefined),
        hora_fin: z.string().nullable().optional(),
        duracion: z.number().nullable().optional(),
        ubicacion: z.string().min(1),
        cedula_organizador: z.string().min(10).max(10),
        imagen: z.string().optional(),
        nota_aprobacion: z.number().min(0).max(10).optional(),
        tiempo_registro_asignacion: z.boolean().optional(),
    }),
    async handler(input) {
        try {
            return await prisma.$transaction(async (tx) => {
                // 1. Verificar que el organizador existe
                const organizador = await tx.organizadores.findUnique({
                    where: { ced_org: input.cedula_organizador }
                });

                if (!organizador) {
                    return {
                        success: false,
                        error: 'El organizador no existe en el sistema'
                    };
                }                // 2. Verificar que la categoría existe
                const categoria = await tx.categorias_eventos.findUnique({
                    where: { id_cat: input.categoria }
                });

                if (!categoria) {
                    return {
                        success: false,
                        error: 'La categoría especificada no existe'
                    };
                }                // 3. Crear el evento
                const nuevoEvento = await tx.eventos.create({
                    data: {
                        nom_eve: input.nombre,
                        des_eve: input.descripcion,
                        id_cat_eve: input.categoria, // Usar directamente el ID
                        fec_ini_eve: input.fecha_inicio,
                        fec_fin_eve: input.fecha_fin,
                        hor_ini_eve: new Date(`1970-01-01T${input.hora_inicio}:00`),
                        hor_fin_eve: input.hora_fin ? new Date(`1970-01-01T${input.hora_fin}:00`) : undefined,
                        dur_eve: input.duracion,
                        are_eve: input.area,
                        ubi_eve: input.ubicacion,
                        ced_org_eve: input.cedula_organizador,
                        img_eve: input.imagen,
                        precio: input.precio,
                        not_apr_eve: input.nota_aprobacion || 7.0,
                        tie_reg_asi: input.tiempo_registro_asignacion ?? true
                    }
                });

                // Convertir a objeto plano
                const eventoSerializable = JSON.parse(JSON.stringify(nuevoEvento));

                return {
                    success: true,
                    message: 'Evento creado correctamente',
                    evento: eventoSerializable
                };
            });
        } catch (error) {
            console.error('Error al crear evento:', error);
            return {
                success: false,
                error: 'Error al crear el evento'
            };
        }
    }
});
