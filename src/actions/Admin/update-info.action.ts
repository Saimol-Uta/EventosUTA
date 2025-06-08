import prisma from "@/db";
import { z } from "zod";
import { defineAction } from "astro:actions";

const schema = z.object({
  columna: z.string().min(1, "Columna es requerida"),
  contenido: z.string().min(1, "Contenido es requerido"),
});

export const guardarContenido = defineAction({
  accept: 'form',
  input: schema,
  handler: async (form) => {
    const { columna, contenido } = form;

    try {
      await prisma.pagina_principal.update({
        where: { id_pag: 1 },
        data: {
          [columna]: contenido,
        },
      });

      return {
        success: true,
        message: "Guardado correctamente", // ✅ importante
      };
    } catch (err) {
      console.error("Error al guardar en la base de datos:", err);
      return {
        success: false,
        message: "Error al guardar en la base de datos", // ✅ importante
      };
    }
  }
});
