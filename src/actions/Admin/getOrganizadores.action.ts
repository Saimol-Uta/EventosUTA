import { defineAction } from 'astro:actions';
import prisma from '@/db';

export const getOrganizadoresCR = defineAction({
  accept: 'json',
  handler: async () => {
    try {
      // Usa include para asegurar la relación y revisa que los datos estén bien relacionados
      const organizadores = await prisma.organizadores.findMany({
        include: {
          eventos: {
            select: {
              id_eve: true,
              nom_eve: true,
              fec_ini_eve: true,
            },
          },
        },
      });

      // Siempre retorna un array para eventos
      const organizadoresConEventos = organizadores.map(org => ({
        ...org,
        eventos: Array.isArray(org.eventos) ? org.eventos : [],
      }));

      // DEBUG: Si ningún organizador tiene eventos, muestra los datos en consola
      if (!organizadores.some(org => org.eventos && org.eventos.length > 0)) {
        console.warn("Ningún organizador tiene eventos asociados. Verifica en la base de datos que la columna ced_org_eve de la tabla eventos coincida exactamente con ced_org de organizadores.");
      }

      return { success: true, organizadores: organizadoresConEventos };
    } catch (error) {
      console.error("Error al obtener organizadores con eventos:", error);
      return { success: false, error: "No se pudieron obtener los datos." };
    }
  },
});
