import { defineAction } from 'astro:actions';
import prisma from '@/db'; // Ajusta la ruta si es necesario
import { z } from 'astro:schema';

export const eliminarOrganizador = defineAction({
  accept: 'json',
  input: z.object({
    cedula: z.string(),
  }),
  handler: async ({ cedula }) => {
    try {
      await prisma.organizadores.delete({
        where: { ced_org: cedula },
      });
      return { success: true };
    } catch (error) {
      console.error("Error al eliminar el organizador:", error);
      return { success: false, error: "No se pudo eliminar el organizador" };
    }
  },
});
