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
    ape_usu2: z.string(), // obligatorio
    fec_nac_usu: z.string(), // obligatorio
    num_tel_usu: z.string().optional().nullable(),
    id_car_per: z.string().optional().nullable(),
  }),
  handler: async ({
    ced_usu,
    nom_usu1,
    nom_usu2,
    ape_usu1,
    ape_usu2,
    fec_nac_usu,
    num_tel_usu,
    id_car_per,
  }) => {
    // Convierte fecha a Date, asume siempre válido porque es obligatorio
    const fecha = new Date(fec_nac_usu);

    // Buscar usuario existente por ced_usu
    const existingUser = await prisma.usuarios.findUnique({
      where: { ced_usu },
    });

    const dataToSave = {
      nom_usu1,
      nom_usu2: nom_usu2 ?? null,
      ape_usu1,
      ape_usu2,
      fec_nac_usu: fecha,
      num_tel_usu: num_tel_usu ?? null,
      id_car_per: id_car_per ?? null,
      ced_usu,
    };

    if (existingUser) {
      // Actualizar
      await prisma.usuarios.update({
        where: { ced_usu },
        data: dataToSave,
      });
    } else {
      // Crear
      await prisma.usuarios.create({
        data: dataToSave,
      });
    }

    return { success: true };
  },
});
