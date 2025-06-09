import { defineAction } from 'astro:actions';
import prisma from '@/db'; // Asegúrate de que la ruta a tu instancia de Prisma es correcta
import { z } from 'astro:schema';

export const getOrganizadoresCR = defineAction({
  accept: 'json',
  input: z.object({
    // Puedes agregar filtros si lo necesitas
  }),
  handler: async () => {
    try {
      // Solo obtener los datos de los organizadores, SIN eventos relacionados
      const organizadores = await prisma.organizadores.findMany({
        select: {
          ced_org: true,         // Cédula del organizador
          nom_org1: true,        // Primer nombre
          nom_org2: true,        // Segundo nombre (opcional)
          ape_org1: true,        // Primer apellido
          ape_org2: true,        // Segundo apellido (opcional)
          tit_aca_org: true,     // Título académico
        },
      });

      return { organizadores };
    } catch (error) {
      console.error("Error al obtener los organizadores:", error);
      return { error: "Error al obtener los organizadores" };
    }
  },
});
