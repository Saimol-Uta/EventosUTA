import { defineAction } from "astro:actions";
import prisma from "@/db";
import { z } from "zod";

const schema = z.object({
  columna: z.string().min(1, "Columna es requerida"),
  contenido: z.string().min(1, "Contenido es requerido"),
});

export const guardarContenido = defineAction({
  accept: "form",
  input: async (data) => {
    // Validar input con zod explícitamente para evitar advertencias
    return schema.parse(data);
  },
  handler: async ({ input }) => {
    const { columna, contenido } = input;

    try {
      await prisma.pagina_principal.update({
        where: { id_pag: 1 },
        data: { [columna]: contenido },
      });

      return { success: true };
    } catch (err) {
      console.error("Error al guardar en la base de datos:", err);
      return { success: false, error: "Error al guardar en la base de datos" };
    }
  }
});
