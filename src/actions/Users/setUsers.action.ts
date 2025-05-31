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
    fec_nac_usu: z.string().nullable().optional(),
    num_tel_usu: z.string().optional().nullable(),
    id_car_per: z.string().optional().nullable(),
  }),
  handler: async (input) => {
    try {
      let fechaValida: Date;
      if (input.fec_nac_usu) {
        const fecha = new Date(input.fec_nac_usu);
        fechaValida = !isNaN(fecha.getTime()) ? fecha : new Date("1900-01-01");
      } else {
        fechaValida = new Date("1900-01-01");
      }

      const existingUser = await prisma.usuarios.findUnique({
        where: { ced_usu: input.ced_usu },
      });

      const dataToSave = {
        nom_usu1: input.nom_usu1,
        nom_usu2: input.nom_usu2 ?? null,
        ape_usu1: input.ape_usu1,
        ape_usu2: input.ape_usu2,
        fec_nac_usu: fechaValida,
        num_tel_usu: input.num_tel_usu ?? null,
        id_car_per: input.id_car_per ?? null,
        ced_usu: input.ced_usu,
      };

      if (existingUser) {
        await prisma.usuarios.update({
          where: { ced_usu: input.ced_usu },
          data: dataToSave,
        });
        return { success: true, created: false };
      } else {
        await prisma.usuarios.create({
          data: dataToSave,
        });
        return { success: true, created: true };
      }
    } catch (error) {
      console.error("Error en setUser:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error guardando usuario. Intente de nuevo.",
      };
    }
  },
});
