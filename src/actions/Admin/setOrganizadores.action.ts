import { defineAction } from 'astro:actions';
import prisma from '@/db';
import { z } from 'astro:schema';

export const setOrganizadores = defineAction({
  accept: 'json',
  input: z.object({
    ced_org: z.string(),
    nom_org1: z.string(),
    nom_org2: z.string().optional(),
    ape_org1: z.string(),
    ape_org2: z.string().optional(),
    tit_aca_org: z.string(),
  }),
  handler: async ({ ced_org, nom_org1, nom_org2, ape_org1, ape_org2, tit_aca_org }) => {
    try {
      const nuevo = await prisma.organizadores.create({
        data: {
          ced_org,
          nom_org1,
          nom_org2: nom_org2 || "",
          ape_org1,
          ape_org2: ape_org2 || "",
          tit_aca_org,
        },
      });
      return { success: true, organizador: nuevo };
    } catch (error: any) {
      if (error.code === 'P2002') {
        return { success: false, error: "Ya existe un organizador con esa cédula." };
      }
      console.error("Error al crear organizador:", error);
      return { success: false, error: "No se pudo crear el organizador." };
    }
  },
});
