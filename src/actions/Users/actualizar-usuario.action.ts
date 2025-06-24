import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const actualizarUsuario = defineAction({
    accept: 'json',
    input: z.object({
        cor_cue: z.string().min(1, 'Correo electrónico requerido'),
        ced_usu: z.string().length(10, 'La cédula debe tener 10 dígitos').optional(),
        nom_usu1: z.string().min(1, 'Primer nombre requerido').max(20).optional(),
        nom_usu2: z.string().max(20).optional(),
        ape_usu1: z.string().min(1, 'Primer apellido requerido').max(20).optional(),
        ape_usu2: z.string().max(20).optional(),
        fec_nac_usu: z.string().or(z.date()).optional(),
        num_tel_usu: z.string().length(10, 'El teléfono debe tener 10 dígitos').optional(),
        id_car_per: z.string().uuid().optional(),
        rol_cue: z.string().max(15).optional(),
        img_user: z.string().optional(),
        enl_ced_cue: z.string().optional(),
        enl_mat_cue: z.string().optional(),
    }),
    handler: async (input) => {
        try {
            const { cor_cue, ...datosParaActualizar } = input;

            
            // Lógica para la fecha
            let fechaActualizada: Date | undefined = undefined;
            if (input.fec_nac_usu) {
                fechaActualizada = new Date(input.fec_nac_usu);
                if (isNaN(fechaActualizada.getTime())) {
                    return { success: false, error: 'El formato de la fecha de nacimiento no es válido.' };
                }
            }

            // Actualización atómica y segura
            // No necesitamos buscar si el usuario existe primero. 'update' fallará si no lo encuentra.
            const usuarioActualizado = await prisma.usuarios.update({
                where: {
                    cor_cue: cor_cue, // Usamos la llave primaria para identificar al usuario
                },
                data: {
                    ...datosParaActualizar,
                    fec_nac_usu: fechaActualizada, // Usamos la fecha ya validada
                },
            });

            return {
                success: true,
                message: 'Usuario actualizado correctamente',
                data: usuarioActualizado,
            };

        } catch (error: any) {
            console.error('Error al actualizar usuario:', error);
            
            // Manejo de errores de Prisma (ej: el usuario a actualizar no se encontró)
            if (error.code === 'P2025') {
                 return { success: false, error: 'Error: El usuario que intentas actualizar no existe.' };
            }

            return { success: false, error: 'Error interno del servidor al actualizar el usuario.' };
        }
    },
});