import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';


export const crearCategoria = defineAction({
    accept: 'form',
    input: z.object({
        nom_cat: z.string().min(1, 'El nombre de la categoría es requerido'),
        des_cat: z.string().min(1, 'La descripción de la categoría es requerida'),
        pun_apr_cat: z.preprocess(
            val => Number(val),
            z.number().min(0, 'El puntaje mínimo es 0').max(10, 'El puntaje máximo es 10')
        ),
        asi_cat: z.preprocess(
            val => Number(val),
            z.number().min(0, 'La asistencia mínima es 0%').max(100, 'La asistencia máxima es 100%')
        ),
        requiere_puntaje: z.preprocess(
            val => val === 'true' || val === true,
            z.boolean()
        ).optional().default(false),
        requiere_asistencia: z.preprocess(
            val => val === 'true' || val === true,
            z.boolean()
        ).optional().default(false),
        brinda_certificado: z.preprocess(
            val => val === 'true' || val === true,
            z.boolean()
        ).optional().default(false)
    }),
    handler: async (input) => {
        try {
            // Crear la nueva categoría
            const nuevaCategoria = await prisma.categorias_eventos.create({
                data: {
                    nom_cat: input.nom_cat,
                    des_cat: input.des_cat,
                    pun_apr_cat: input.pun_apr_cat,
                    asi_cat: input.asi_cat,
                    requiere_puntaje: input.requiere_puntaje,
                    requiere_asistencia: input.requiere_asistencia,
                    brinda_certificado: input.brinda_certificado
                }
            });

            const CategoriaNuevoPlano = JSON.parse(JSON.stringify(nuevaCategoria));

            return {
                success: true,
                data: CategoriaNuevoPlano,
                message: 'Categoría creada exitosamente'
            };
        } catch (error) {
            console.error('Error al crear categoría:', error);
            return {
                success: false,
                error: 'Error al crear la categoría',
                message: 'No se pudo crear la categoría'
            };
        }
    }
});
