import { defineAction } from 'astro:actions';
import prisma from '@/db';
import { z } from 'astro:schema';

export const updateOrganizadores = defineAction({
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
      const actualizado = await prisma.organizadores.update({
        where: { ced_org },
        data: {
          nom_org1,
          nom_org2: nom_org2 || "",
          ape_org1,
          ape_org2: ape_org2 || "",
          tit_aca_org,
        },
      });
      return { success: true, organizador: actualizado };
    } catch (error: any) {
      console.error("Error al actualizar organizador:", error);
      return { success: false, error: "No se pudo actualizar el organizador." };
    }
  },
});
