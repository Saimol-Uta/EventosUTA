import prisma from "@/db";
import { z } from "zod";

const schema = z.object({
  columna: z.string().min(1, "Columna es requerida"),
  contenido: z.string().min(1, "Contenido es requerido"),
});

export async function guardarContenido(json: any) {
  const parseResult = schema.safeParse(json);

  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors.map(err => err.message).join(", ");
    return { success: false, error: errorMsg };
  }

  const { columna, contenido } = parseResult.data;

  try {
    await prisma.pagina_principal.update({
      where: { id_pag: 1 },
      data: {
        [columna]: contenido,
      },
    });

    return { success: true };
  } catch (err) {
    console.error("Error al guardar en la base de datos:", err);
    return { success: false, error: "Error al guardar en la base de datos" };
  }
}
