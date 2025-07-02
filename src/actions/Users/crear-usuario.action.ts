import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';
import bcrypt from 'bcryptjs';
import { validateEmail } from '../auth/verificacionCorreo';

export const crearUsuario = defineAction({
    accept: 'json',
    input: z.object({
        cor_cue: z.string().email('El correo electrónico no es válido.').transform(val => val.toLowerCase().trim()),
        cont_cuenta: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
        ced_usu: z.string().length(10, 'La cédula debe tener exactamente 10 dígitos.').transform(val => val.trim()),
        nom_usu1: z.string().min(1, 'El primer nombre es obligatorio.').max(20).transform(val => val.trim()),
        nom_usu2: z.string().max(20).optional().nullable(),
        ape_usu1: z.string().min(1, 'El primer apellido es obligatorio.').max(20).transform(val => val.trim()),
        ape_usu2: z.string().max(20).optional().nullable(),
        fec_nac_usu: z.string().min(1, 'La fecha de nacimiento es obligatoria.'),
        num_tel_usu: z.string().length(10, 'El teléfono debe tener 10 dígitos.').optional().nullable(),
        id_car_per: z.string().uuid().optional().nullable(),
        rol_cue: z.enum(['ESTUDIANTE', 'ADMINISTRADOR', 'USUARIO']),
        img_user: z.string().url().optional().nullable(),
        enl_ced_cue: z.string().url().optional().nullable(),
        enl_mat_cue: z.string().url().optional().nullable(),
    }),
    handler: async (input) => {
        try {

            // Si el correo no es institucional, se verifica su existencia.
            if (!input.cor_cue.endsWith('@uta.edu.ec')) {
                const isEmailValid = await validateEmail(input.cor_cue);
                if (!isEmailValid) {
                    // Si el correo no es válido, devolvemos un error específico.
                    return {
                        success: false,
                        error: 'El correo electrónico no parece ser válido o el dominio no existe.',
                    };
                }
            }
            // ✅ 2. Hasheamos la contraseña de forma segura.
            const hashedPassword = bcrypt.hashSync(input.cont_cuenta, 10);

            // ✅ 3. Usamos UNA SOLA operación 'create'.
            // No necesitamos verificar si el usuario existe primero.
            // Si el 'cor_cue' (que es el @id) ya existe, Prisma lanzará un error P2002
            // que atraparemos en el bloque catch. Es más eficiente y seguro.
            const nuevoUsuario = await prisma.usuarios.create({
                data: {
                    ...input, // Usamos todos los datos del input ya validados y transformados
                    fec_nac_usu: new Date(input.fec_nac_usu), // Convertimos la fecha
                    cont_cuenta: hashedPassword, // Guardamos la contraseña hasheada
                    verificado: true, // O 'false' si necesitas un flujo de verificación
                },
            });

            // No devolvemos datos sensibles en la respuesta.
            return {
                success: true,
                message: `Usuario ${nuevoUsuario.cor_cue} creado exitosamente.`,
            };

        } catch (error: any) {
            console.error('Error al crear cuenta:', error);

            // ✅ 4. Manejo de errores de Prisma mejorado.
            // Si el correo ya existe, Prisma arroja el código 'P2002'.
            if (error.code === 'P2002' && error.meta?.target?.includes('cor_cue')) {
                return {
                    success: false,
                    error: 'Ya existe una cuenta registrada con este correo electrónico.',
                };
            }

            // Para otros errores, devolvemos un mensaje genérico.
            return {
                success: false,
                error: 'No se pudo registrar la cuenta. Por favor, intente de nuevo.',
            };
        }
    },
});
