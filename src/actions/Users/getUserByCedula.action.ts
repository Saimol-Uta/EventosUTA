import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export type Usuario = {
  id_usu: string;
  ced_usu: string | null;
  cor_cue: string | null;
  nom_usu1: string;
  nom_usu2: string | null;
  ape_usu1: string;
  ape_usu2: string | null;
  fec_nac_usu: Date;
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
    ced_usu: z.string().optional(),
    cor_cue: z.string().optional(),
  }),
  handler: async ({ ced_usu, cor_cue }): Promise<ResultadoGetUser> => {
    let usuarioRaw = null;

    if (ced_usu) {
      usuarioRaw = await prisma.usuarios.findUnique({
        where: { ced_usu }, // ced_usu es único
        select: {
          cor_cue: true, // este es el ID
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
    } else if (cor_cue) {
      usuarioRaw = await prisma.usuarios.findUnique({
        where: { cor_cue }, // cor_cue es el ID
        select: {
          cor_cue: true,
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
    }

    if (!usuarioRaw) return { encontrado: false };

    const usuario: Usuario = {
      id_usu: usuarioRaw.cor_cue, // usa cor_cue como id_usu
      ced_usu: usuarioRaw.ced_usu,
      cor_cue: usuarioRaw.cor_cue,
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
