import { defineAction } from 'astro:actions';
import prisma from '@/db';
import { z } from 'astro:schema';

export const eliminarOrganizador = defineAction({
  accept: 'json',
  input: z.object({
    cedula: z.string(),
  }),
  handler: async ({ cedula }) => {
    try {
      // Verifica si el organizador existe
      const existe = await prisma.organizadores.findUnique({
        where: { ced_org: cedula },
      });

      if (!existe) {
        return { success: false, error: "El organizador no existe." };
      }

      // Verifica si tiene eventos asociados
      const tieneEventos = await prisma.eventos.findFirst({
        where: { ced_org_eve: cedula },
        select: { id_eve: true }, // Solo necesitamos saber si existe
      });

      if (tieneEventos) {
        return {
          success: false,
          error: "No se puede eliminar: el organizador tiene eventos asociados.",
        };
      }

      // Elimina el organizador
      await prisma.organizadores.delete({
        where: { ced_org: cedula },
      });

      return { success: true };
    } catch (error: any) {
      console.error("Error al eliminar el organizador:", error);
      return { success: false, error: "No se pudo eliminar el organizador." };
    }
  },
});
