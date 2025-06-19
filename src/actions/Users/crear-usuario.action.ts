import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';
import bcrypt from 'bcryptjs';

export const crearUsuario = defineAction({
    accept: 'json',
    input: z.object({
        cor_cue: z.string().email('Debe ser un correo electrónico válido').max(150),
        ced_usu: z.string().length(10, 'La cédula debe tener exactamente 10 dígitos'),
        nom_usu1: z.string().min(1, 'Primer nombre requerido').max(20),
        nom_usu2: z.string().max(20).optional(),
        ape_usu1: z.string().min(1, 'Primer apellido requerido').max(20),
        ape_usu2: z.string().max(20).optional(),
        fec_nac_usu: z.string().or(z.date()),
        num_tel_usu: z.string().length(10, 'El teléfono debe tener 10 dígitos').optional(),
        id_car_per: z.string().uuid().optional(),
        rol_cue: z.string().max(15).default('ESTUDIANTE'),
        cont_cuenta: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
        img_user: z.string().optional(),
        enl_ced_cue: z.string().optional(),
        enl_mat_cue: z.string().optional(),
    }),
    handler: async (input) => {
        try {
            // Verificar que el correo no esté en uso
            const correoExistente = await prisma.usuarios.findUnique({
                where: { cor_cue: input.cor_cue }
            });

            if (correoExistente) {
                return {
                    success: false,
                    message: 'El correo electrónico ya está registrado'
                };
            }

            // Verificar que la cédula no esté en uso
            const cedulaExistente = await prisma.usuarios.findUnique({
                where: { ced_usu: input.ced_usu }
            });

            if (cedulaExistente) {
                return {
                    success: false,
                    message: 'La cédula ya está registrada'
                };
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

            // Validar fecha de nacimiento
            const fechaNacimiento = typeof input.fec_nac_usu === 'string'
                ? new Date(input.fec_nac_usu)
                : input.fec_nac_usu;

            if (isNaN(fechaNacimiento.getTime())) {
                return {
                    success: false,
                    message: 'Fecha de nacimiento inválida'
                };
            }

            // Verificar que el usuario sea mayor de edad
            const edad = Math.floor((Date.now() - fechaNacimiento.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            if (edad < 16) {
                return {
                    success: false,
                    message: 'El usuario debe tener al menos 16 años'
                };
            }

            // Encriptar contraseña
            const hashedPassword = await bcrypt.hash(input.cont_cuenta, 12);

            // Crear usuario
            const nuevoUsuario = await prisma.usuarios.create({
                data: {
                    cor_cue: input.cor_cue.toLowerCase().trim(),
                    ced_usu: input.ced_usu.trim(),
                    nom_usu1: input.nom_usu1.trim(),
                    nom_usu2: input.nom_usu2?.trim() || null,
                    ape_usu1: input.ape_usu1.trim(),
                    ape_usu2: input.ape_usu2?.trim() || null,
                    fec_nac_usu: fechaNacimiento,
                    num_tel_usu: input.num_tel_usu?.trim() || null,
                    id_car_per: input.id_car_per || null,
                    rol_cue: input.rol_cue.toUpperCase(),
                    cont_cuenta: hashedPassword,
                    img_user: input.img_user || null,
                    enl_ced_cue: input.enl_ced_cue || null,
                    enl_mat_cue: input.enl_mat_cue || null,
                },
                include: {
                    carreras: {
                        include: {
                            facultades: true
                        }
                    }
                }
            });

            // Remover la contraseña del resultado
            const { cont_cuenta, ...usuarioSinPassword } = nuevoUsuario;

            return {
                success: true,
                message: 'Usuario creado correctamente',
                data: usuarioSinPassword
            };

        } catch (error: any) {
            console.error('Error al crear usuario:', error);

            // Manejo específico de errores de Prisma
            if (error.code === 'P2002') {
                const target = error.meta?.target;
                if (target?.includes('cor_cue')) {
                    return {
                        success: false,
                        message: 'El correo electrónico ya está registrado'
                    };
                }
                if (target?.includes('ced_usu')) {
                    return {
                        success: false,
                        message: 'La cédula ya está registrada'
                    };
                }
                return {
                    success: false,
                    message: 'Ya existe un usuario con esos datos'
                };
            }

            if (error.code === 'P2003') {
                return {
                    success: false,
                    message: 'Error de referencia: carrera no válida'
                };
            }

            return {
                success: false,
                message: 'Error interno del servidor al crear el usuario'
            };
        }
    }
});
