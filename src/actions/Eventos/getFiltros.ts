import { defineAction } from 'astro:actions';
import prisma from '../../db';
import { z } from 'astro:schema';

export const getEventosFiltrados = defineAction({
    accept: 'json',
    input: z.object({
        carrera: z.string().optional(),
        area: z.string().optional(),
        duracion: z.string().optional(),
        page: z.number().default(1),
        cursosPorPagina: z.number().default(8),
    }),
    handler: async ({ carrera, area, duracion, page = 1, cursosPorPagina = 8 }) => {
        const skip = (page - 1) * cursosPorPagina;
        const take = cursosPorPagina;

        // Construcción del objeto 'where' para los filtros
        const where: any = {};
        const condiciones: any[] = [];
        
        // Filtro por carrera usando las asignaciones
        if (carrera) {
            condiciones.push({ 
                asignaciones: {
                    detalle_asignaciones: {
                        some: {
                            carreras: {
                                nom_car: carrera
                            }
                        }
                    }
                }
            });
        }
        
        // Filtro por área
        if (area) {
            condiciones.push({ are_eve: area });
        }
        
        // Filtro por duración - usando rangos dinámicos
        if (duracion) {
            switch (duracion) {
                case "Menos de 100 horas":
                    condiciones.push({ dur_eve: { lt: 100 } });
                    break;
                case "100 - 500 horas":
                    condiciones.push({ dur_eve: { gte: 100, lte: 500 } });
                    break;
                case "500 - 1000 horas":
                    condiciones.push({ dur_eve: { gte: 500, lte: 1000 } });
                    break;
                case "Más de 1000 horas":
                    condiciones.push({ dur_eve: { gt: 1000 } });
                    break;
                // Mantener compatibilidad con rangos anteriores por si hay URLs con filtros antiguos
                case "Menos de 5 horas":
                    condiciones.push({ dur_eve: { lt: 5 } });
                    break;
                case "De 5 a 30 horas":
                    condiciones.push({ dur_eve: { gte: 5, lte: 30 } });
                    break;
                case "De 30 a 60 horas":
                    condiciones.push({ dur_eve: { gte: 30, lte: 60 } });
                    break;
                case "Más de 60 horas":
                    condiciones.push({ dur_eve: { gt: 60 } });
                    break;
            }
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
