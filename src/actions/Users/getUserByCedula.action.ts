import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export type Usuario = {
  id_usu: string;
  ced_usu: string | null;
  nom_usu1: string;
  nom_usu2: string | null;
  ape_usu1: string;
  ape_usu2: string | null;
  fec_nac_usu: Date; // Fecha no nullable
  num_tel_usu: string | null;
  id_car_per: string | null;
};

export type ResultadoGetUser = {
  encontrado: boolean;
  usuario?: Usuario | null;
};

export const getUserByCedula = defineAction({
  accept: 'json',
  input: z.object({
    ced_usu: z.string().length(10, "La cédula debe tener exactamente 10 dígitos"),
  }),
  handler: async ({ ced_usu }): Promise<ResultadoGetUser> => {
    const usuarioRaw = await prisma.usuarios.findUnique({
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

    if (!usuarioRaw) return { encontrado: false };

    const usuario: Usuario = {
      id_usu: usuarioRaw.id_usu,
      ced_usu: usuarioRaw.ced_usu,
      nom_usu1: usuarioRaw.nom_usu1,
      nom_usu2: usuarioRaw.nom_usu2 ?? null,
      ape_usu1: usuarioRaw.ape_usu1,
      ape_usu2: usuarioRaw.ape_usu2 ?? null,
      fec_nac_usu: usuarioRaw.fec_nac_usu,
      num_tel_usu: usuarioRaw.num_tel_usu ?? null,
      id_car_per: usuarioRaw.id_car_per ?? null,
    };

    return { encontrado: true, usuario };
  }
});
