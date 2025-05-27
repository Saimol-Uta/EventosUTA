import { defineAction } from 'astro:actions';
import prisma from '../../db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { validateEmail } from './verificacionCorreo.ts';

export const SignIn = defineAction({
  input: z.object({
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

    const { nombre, apellido, correo, contrasena, fechNac } = input;

    try {
      // Verificar si el correo ya existe antes de crear.
      const cuentaExistente = await prisma.cuentas.findUnique({
        where: {
          cor_cue: correo,
        },
      });

      if (cuentaExistente) {
        throw new Error('El correo electrónico ya está registrado.');
      }
      if (!correo.endsWith('@uta.edu.ec')) {
        const isEmailValid = await validateEmail(correo);
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
      const rolAsignado = correo.endsWith('@uta.edu.ec') ? 'ESTUDIANTE' : 'USUARIO';

      // Transacción para crear usuario y cuenta asegurando atomicidad.
      const result = await prisma.$transaction(async (tx) => {
        const usuario = await tx.usuarios.create({
          data: {
            nom_usu1,
            nom_usu2: nom_usu2 || '',
            ape_usu1,
            ape_usu2: ape_usu2 || '',
            fec_nac_usu: new Date(fechNac),
            // Campos opcionales o a completar después:
            // ced_usu: null, 
            // num_tel_usu: null,
            // id_car_per: null, 
          },
        });

        await tx.cuentas.create({
          data: {
            cor_cue: correo,
            cont_cuenta: hashedPassword,
            rol_cue: rolAsignado,
            id_usu_per: usuario.id_usu,
            // Campos opcionales o a completar después:
            // enl_ced_cue: usuario.ced_usu,
            // enl_ext_cue: null,
            // enl_mat_cue: null,
          },
        });
        return usuario; // Devuelve el usuario creado para obtener su ID.
      });

      return { success: true, userId: result.id_usu };

    } catch (error: any) {
      console.error('Error en registro (action):', error);
      return {
        success: false,
        error: { message: error.message || 'Error interno del servidor.' }
      };
    }
  },
});