import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db'; // Ajusta la ruta según tu proyecto

export const getUser = defineAction({
  accept: 'json',  // o 'form' si usas formData
  input: z.object({
    ced_usu: z.string().length(10, "La cédula debe tener exactamente 10 dígitos"),
  }),
  handler: async ({ ced_usu }) => {
    try {
      const usuario = await prisma.usuarios.findUnique({
        where: { ced_usu },
        select: {
          id_usu: true,
          ced_usu: true,
          nom_usu1: true,
          nom_usu2: true,
          ape_usu1: true,
          ape_usu2: true,
          fec_nac_usu: true,
          num_tel_usu: true,
          id_car_per: true,
        }
      });

      if (!usuario) {
        return { encontrado: false };
      }

      return { encontrado: true, usuario };
    } catch (error) {
      return { encontrado: false, error: 'Error en la consulta' };
    }
  }
});
