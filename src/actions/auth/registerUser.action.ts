import { defineAction } from 'astro:actions';
import prisma from '../../db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const SignIn = defineAction({
  input: z.object({
    nombre: z.string().min(1),
    apellido: z.string().min(1),
    correo: z.string().email(),
    contrasena: z.string().min(6),
    fechNac: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Fecha inválida' }),
  }),
  handler: async (input) => {
    const { nombre, apellido, correo, contrasena, fechNac } = input;

    // Separar nombre y apellido en principales y secundarios (ejemplo simple)
    const [nom_usu1, nom_usu2] = nombre.split(' ');
    const [ape_usu1, ape_usu2] = apellido.split(' ');

    const hashedPassword = await bcrypt.hash(contrasena, 10);

    try {
      // Crear usuario
      const usuario = await prisma.usuarios.create({
        data: {
          nom_usu1,
          nom_usu2: nom_usu2 || '',
          ape_usu1,
          ape_usu2: ape_usu2 || '',
          fec_nac_usu: new Date(fechNac),
          ced_usu: null,
          num_tel_usu: null,
          id_car_per: null,
        },
      });

      // Crear cuenta vinculada
      await prisma.cuentas.create({
        data: {
          cor_cue: correo,
          cont_cuenta: hashedPassword,
          rol_cue: 'USUARIO',
          id_usu_per: usuario.id_usu,
          enl_ced_cue: usuario.ced_usu,
          enl_ext_cue: null,
          enl_mat_cue: null,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Error en registro:', error);
      return {
        success: false,
        error: 'Error interno del servidor.',
      };
    }
  },
});