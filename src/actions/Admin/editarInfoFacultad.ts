// src/actions/guardarContenido.ts
import { defineAction } from "astro:actions";
import prisma from "@/db";

export const guardarContenido = defineAction({
  accept: "form",
  handler: async ({ request }) => {
    const data = await request.formData();
    const columna = data.get("columna")?.toString();
    const contenido = data.get("contenido")?.toString();

    if (!columna || !contenido) {
      return new Response("Datos inválidos", { status: 400 });
    }

    await prisma.pagina_principal.update({
      where: { id_pag: 1 },
      data: { [columna]: contenido },
    });

    return new Response(null, {
      status: 302,
      headers: { Location: "/" }, // Redirecciona después de guardar
    });
  },
});
