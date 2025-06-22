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
            // Verificar que el usuario existe
            const usuarioExistente = await prisma.usuarios.findUnique({
                where: { cor_cue: input.cor_cue }
            });

            if (!usuarioExistente) {
                return {
                    success: false,
                    message: 'Usuario no encontrado'
                };
            }

            // Si se proporciona una nueva cédula, verificar que no esté en uso
            if (input.ced_usu && input.ced_usu !== usuarioExistente.ced_usu) {
                const cedulaExistente = await prisma.usuarios.findUnique({
                    where: { ced_usu: input.ced_usu }
                });

                if (cedulaExistente) {
                    return {
                        success: false,
                        message: 'La cédula ya está registrada por otro usuario'
                    };
                }
            }

            // Si se proporciona una carrera, verificar que existe
            if (input.id_car_per) {
                const carreraExistente = await prisma.carreras.findUnique({
                    where: { id_car: input.id_car_per }
                });

                if (!carreraExistente) {
                    return {
                        success: false,
                        message: 'La carrera especificada no existe'
                    };
                }
            }

            // Preparar datos para actualización (solo campos que se proporcionaron)
            const datosActualizacion: any = {};

            if (input.ced_usu !== undefined) datosActualizacion.ced_usu = input.ced_usu;
            if (input.nom_usu1 !== undefined) datosActualizacion.nom_usu1 = input.nom_usu1;
            if (input.nom_usu2 !== undefined) datosActualizacion.nom_usu2 = input.nom_usu2;
            if (input.ape_usu1 !== undefined) datosActualizacion.ape_usu1 = input.ape_usu1;
            if (input.ape_usu2 !== undefined) datosActualizacion.ape_usu2 = input.ape_usu2;
            if (input.fec_nac_usu !== undefined) {
                datosActualizacion.fec_nac_usu = typeof input.fec_nac_usu === 'string'
                    ? new Date(input.fec_nac_usu)
                    : input.fec_nac_usu;
            }
            if (input.num_tel_usu !== undefined) datosActualizacion.num_tel_usu = input.num_tel_usu;
            if (input.id_car_per !== undefined) datosActualizacion.id_car_per = input.id_car_per;
            if (input.rol_cue !== undefined) datosActualizacion.rol_cue = input.rol_cue;
            if (input.img_user !== undefined) datosActualizacion.img_user = input.img_user;
            if (input.enl_ced_cue !== undefined) datosActualizacion.enl_ced_cue = input.enl_ced_cue;
            if (input.enl_mat_cue !== undefined) datosActualizacion.enl_mat_cue = input.enl_mat_cue;

            // Actualizar usuario
            const usuarioActualizado = await prisma.usuarios.update({
                where: { cor_cue: input.cor_cue },
                data: datosActualizacion,
                include: {
                    carreras: {
                        include: {
                            facultades: true
                        }
                    }
                }
            });

            return {
                success: true,
                message: 'Usuario actualizado correctamente',
                data: usuarioActualizado
            };

        } catch (error: any) {
            console.error('Error al actualizar usuario:', error);

            // Manejo específico de errores de Prisma
            if (error.code === 'P2002') {
                return {
                    success: false,
                    message: 'Ya existe un usuario con esos datos únicos (cédula o correo)'
                };
            }

            if (error.code === 'P2003') {
                return {
                    success: false,
                    message: 'Error de referencia: carrera o facultad no válida'
                };
            }

            return {
                success: false,
                message: 'Error interno del servidor al actualizar el usuario'
            };
        }
    }
});
