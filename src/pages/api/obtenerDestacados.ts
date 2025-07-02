import type { APIRoute } from "astro";
import db from "../../db";

export const GET: APIRoute = async ({ request }) => {
    try {
        // Obtener todos los eventos marcados como destacados en la BD
        const eventosDestacados = await db.eventos.findMany({
            where: {
                es_destacado: true
            },
            select: {
                id_eve: true
            }
        });

        const idsDestacados = eventosDestacados.map((evento: { id_eve: string }) => evento.id_eve);

        return new Response(JSON.stringify({
            success: true,
            eventosDestacados: idsDestacados
        }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        });

    } catch (error) {
        console.error("Error al obtener eventos destacados:", error);
        return new Response(JSON.stringify({
            success: false,
            error: "Error interno del servidor"
        }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
};
