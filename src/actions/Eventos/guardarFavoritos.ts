import { defineAction } from "astro:actions";
import prisma from "@/db";

export const guardarFavoritos = defineAction({
  accept: "json",
  handler: async ({ request }) => {
    const { eventos } = await request.json();

    if (!Array.isArray(eventos) || eventos.length !== 6) {
      return {
        success: false,
        message: "Debes seleccionar exactamente 6 eventos.",
      };
    }

    try {
      const idsSeleccionados = eventos.map((id_eve: string ) => id_eve);

      // Primero, desmarcar todos los eventos que estaban como destacados
      await prisma.eventos.updateMany({
        data: { es_destacado: false },
        where: { es_destacado: true },
      });

      // Luego, marcar como destacados los nuevos 6
      await prisma.eventos.updateMany({
        data: { es_destacado: true },
        where: { id_eve: { in: idsSeleccionados } },
      });

      return {
        success: true,
        message: "Eventos destacados actualizados correctamente.",
      };
    } catch (error) {
      console.error("Error al guardar favoritos:", error);
      return {
        success: false,
        message: "Ocurrió un error al guardar.",
      };
    }
  },
});

