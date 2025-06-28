import { defineAction } from 'astro:actions';
import prisma from '../../db';
import { z } from 'astro:schema';

export const getEventosFiltrados = defineAction({
    accept: 'json',
    input: z.object({
        categoria: z.string().optional(),
        duracion: z.string().optional(),
        page: z.number().default(1),
        cursosPorPagina: z.number().default(8),
    }),
    handler: async ({ categoria, duracion, page = 1, cursosPorPagina = 8 }) => {
        const skip = (page - 1) * cursosPorPagina;
        const take = cursosPorPagina;

        // Construcción del objeto 'where' para los filtros
        // (Tu lógica aquí era correcta, la mantenemos)
        const where: any = {};
        const condiciones: any[] = [];
        if (categoria) {
            condiciones.push({ id_cat_eve: categoria });
        }
        if (duracion) {
            // ... (tu switch de duración va aquí)
        }
        if (condiciones.length > 0) {
            where.AND = condiciones;
        }

        try {
            // SOLUCIÓN #2: Usamos $transaction para ejecutar ambas consultas en paralelo
            const [eventos, totalEventos] = await prisma.$transaction([
                prisma.eventos.findMany({
                    where,
                    skip,
                    take,
                    orderBy: { nom_eve: 'asc' },
                    // SOLUCIÓN #1: Reemplazamos el 'include' masivo por un '_count' eficiente
                    include: {
                        categorias_eventos: true,
                        organizadores: true,
                        _count: { // Contamos las inscripciones en lugar de traerlas todas
                            select: { inscripciones: true },
                        },
                    },
                }),
                prisma.eventos.count({ where }), // La consulta de conteo no cambia
            ]);

            return {
                success: true,
                // ¡IMPORTANTE! La estructura de 'eventos' ahora es diferente
                // y la de la respuesta también.
                data: {
                    eventos,
                    totalEventos,
                }
            };
        } catch (error) {
            console.error("Error al obtener eventos filtrados:", error);
            return {
                success: false,
                error: 'Error al obtener eventos filtrados',
            };
        }
    },
});
