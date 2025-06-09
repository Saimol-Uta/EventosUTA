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
      // Verifica si el organizador existe antes de eliminar
      const existe = await prisma.organizadores.findUnique({
        where: { ced_org: cedula },
      });
      if (!existe) {
        return { success: false, error: "El organizador no existe" };
      }

      // Si hay relaciones (por ejemplo, eventos), elimina o desconecta primero si es necesario
      // await prisma.eventos.updateMany({
      //   where: { ced_org: cedula },
      //   data: { ced_org: null }
      // });

      await prisma.organizadores.delete({
        where: { ced_org: cedula },
      });
      return { success: true };
    } catch (error: any) {
      // Si hay error de restricción de clave foránea
      if (error.code === 'P2003' || error.code === 'P2014') {
        return { success: false, error: "No se puede eliminar: el organizador tiene registros relacionados." };
      }
      console.error("Error al eliminar el organizador:", error);
      return { success: false, error: "No se pudo eliminar el organizador" };
    }
  },
});
