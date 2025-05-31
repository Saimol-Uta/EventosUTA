import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const setUser = defineAction({
  accept: 'form',
  input: z.object({
    ced_usu: z.string().length(10),
    nom_usu1: z.string(),
    nom_usu2: z.string().optional().nullable(),
    ape_usu1: z.string(),
    ape_usu2: z.string(),
    fec_nac_usu: z.string(),
    num_tel_usu: z.string().optional().nullable(),
    id_car_per: z.string().optional().nullable(),
  }),
  handler: async (input) => {
    try {
      // Validar fecha
      const fecha = new Date(input.fec_nac_usu);
      if (isNaN(fecha.getTime())) {
        return { success: false, error: "Fecha de nacimiento inválida." };
      }

      // Buscar usuario existente
      const existingUser = await prisma.usuarios.findUnique({
        where: { ced_usu: input.ced_usu },
      });

      const dataToSave = {
        nom_usu1: input.nom_usu1,
        nom_usu2: input.nom_usu2 ?? null,
        ape_usu1: input.ape_usu1,
        ape_usu2: input.ape_usu2,
        fec_nac_usu: fecha,
        num_tel_usu: input.num_tel_usu ?? null,
        id_car_per: input.id_car_per ?? null,
        ced_usu: input.ced_usu,
      };

      if (existingUser) {
        // Actualizar
        await prisma.usuarios.update({
          where: { ced_usu: input.ced_usu },
          data: dataToSave,
        });
      } else {
        // Crear nuevo
        await prisma.usuarios.create({
          data: dataToSave,
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Error en setUser:", error);
      return { success: false, error: "Error guardando usuario. Intente de nuevo." };
    }
  },
});
