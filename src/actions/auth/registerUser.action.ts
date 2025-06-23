import { defineAction } from 'astro:actions';
import prisma from '../../db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { validateEmail } from './verificacionCorreo.ts';
import crypto from 'crypto';
import { sendVerificationEmail } from './sendEmail.ts';

function validarCedula(cedula: string): boolean {
    if (!/^\d{10}$/.test(cedula)) return false;

    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) return false;

    const digitos = cedula.split("").map(Number);
    const digitoVerificador = digitos[9];

    let suma = 0;
    for (let i = 0; i < 9; i++) {
        let val = digitos[i];
        if (i % 2 === 0) {
            val *= 2;
            if (val > 9) val -= 9;
        }
        suma += val;
    }
    const decenaSuperior = Math.ceil(suma / 10) * 10;
    const digitoCalculado = decenaSuperior - suma;

    if (digitoCalculado === 10) {
        return digitoVerificador === 0;
    } else {
        return digitoVerificador === digitoCalculado;
    }
}

export const SignIn = defineAction({
    input: z.object({
        cedula: z.string()
            .min(10, { message: "La cédula debe tener 10 dígitos." })
            .max(10, { message: "La cédula debe tener 10 dígitos." })
            .refine(validarCedula, { message: "La cédula ingresada no es válida." }),
        nombre: z.string().min(1, { message: "El nombre es obligatorio." }),
        apellido: z.string().min(1, { message: "El apellido es obligatorio." }),
        correo: z.string().email({ message: "Debe ser un correo electrónico válido." }),
        contrasena: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
        fechNac: z.string()
            .refine((val) => !isNaN(Date.parse(val)), { message: 'Fecha de nacimiento inválida.' })
            .refine((val) => { // Validar edad también en el backend
                const hoy = new Date();
                const nacimiento = new Date(val);
                let edad = hoy.getFullYear() - nacimiento.getFullYear();
                const m = hoy.getMonth() - nacimiento.getMonth();
                if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
                    edad--;
                }
                return edad >= 18;
            }, { message: "Debes ser mayor de 18 años para registrarte." }),
    }),
    handler: async (input) => {

        const { cedula, nombre, apellido, correo, contrasena, fechNac } = input;
        let usuarioCreadoCorreo: string | null = null;
        const correoLimpio = correo.trim().toLowerCase(); try {
            // Verificar si el correo ya existe antes de crear.
            const usuarioExistente = await prisma.usuarios.findUnique({
                where: {
                    cor_cue: correoLimpio,
                },
            });

            if (usuarioExistente) {
                throw new Error('El correo electrónico ya está registrado.');
            }

            if (!correoLimpio.endsWith('@uta.edu.ec')) {
                const isEmailValid = await validateEmail(correoLimpio);
                if (!isEmailValid) {
                    return {
                        success: false,
                        error: 'El correo no parece ser válido o no existe.',
                    };
                }
            }

            const [nom_usu1, ...nom_usu2Rest] = nombre.split(' ');
            const nom_usu2 = nom_usu2Rest.join(' ');
            const [ape_usu1, ...ape_usu2Rest] = apellido.split(' ');
            const ape_usu2 = ape_usu2Rest.join(' ');
            const hashedPassword = await bcrypt.hash(contrasena, 10);
            const rolAsignado = correoLimpio.endsWith('@uta.edu.ec') ? 'ESTUDIANTE' : 'USUARIO';
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const expirationDate = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

            // Crear usuario directamente en la tabla usuarios con toda la información
            const nuevoUsuario = await prisma.usuarios.create({
                data: {
                    cor_cue: correoLimpio,
                    cont_cuenta: hashedPassword,
                    rol_cue: rolAsignado,
                    ced_usu: cedula, // Se completará después en el perfil
                    nom_usu1,
                    nom_usu2: nom_usu2 || null,
                    ape_usu1,
                    ape_usu2: ape_usu2 || null,
                    fec_nac_usu: new Date(fechNac),
                    cod_ver: verificationToken,
                    fec_exp_cod: expirationDate,
                    verificado: false,
                    num_tel_usu: null,
                    id_car_per: null,
                    enl_ced_cue: null,
                    enl_mat_cue: null,
                    img_user: null,
                },
            });

            usuarioCreadoCorreo = nuevoUsuario.cor_cue;

            await sendVerificationEmail(correoLimpio, verificationToken);
            return { success: true,  message: "¡Registro exitoso! Revisa tu correo para verificar tu cuenta." };

        } catch (error: any) {
            console.error('Error en registro (action):', error);

            // Si hubo un error y el usuario llegó a crearse, lo eliminamos.
            if (usuarioCreadoCorreo) {
                console.log(`Error detectado. Revirtiendo creación del usuario: ${usuarioCreadoCorreo}`);
                await prisma.usuarios.delete({
                    where: { cor_cue: usuarioCreadoCorreo }
                }).catch(deleteError => {
                    // Loguear si la eliminación falla, pero el error principal es más importante.
                    console.error(`FALLO CRÍTICO: No se pudo revertir la creación del usuario ${usuarioCreadoCorreo}.`, deleteError);
                });
            }

            return {
                success: false,
                error: { message: error.message || 'Error interno del servidor.' }
            };
        }
    },
});