import { defineAction } from 'astro:actions';
import prisma from '../../db';
import { z } from 'astro:schema';

export const getEventosFiltrados = defineAction({
    accept: 'json',

    input: z.object({
        categoria: z.string().optional(),
        duracion: z.string().optional(),
    }),

    handler: async ({ categoria, duracion }) => {
        try {
            const condiciones: any[] = [];
           

            // ✅ Filtro por categoría (ID de categoría del evento)
            if (categoria) {
                condiciones.push({ id_cat_eve: categoria });
            }

            // ✅ Filtro por duración (rango de minutos)
            if (duracion) {
                switch (duracion) {
                    case "Menos de 5 horas":
                        condiciones.push({ dur_eve: { lt: 300 } });
                        break;
                    case "De 5 a 30 horas":
                        condiciones.push({ dur_eve: { gte: 300, lt: 1800 } });
                        break;
                    case "De 30 a 60 horas":
                        condiciones.push({ dur_eve: { gte: 1800, lt: 3600 } });
                        break;
                    case "Más de 60 horas":
                        condiciones.push({ dur_eve: { gte: 3600 } });
                        break;
                }
            }

            const eventos = await prisma.eventos.findMany({
                where: condiciones.length > 0 ? { AND: condiciones } : undefined,
                orderBy: { nom_eve: 'asc' },
                include: {
                    categorias_eventos: true,
                    organizadores: true,
                    inscripciones: {
                        include: {
                            usuarios: true
                        }
                    }
                },
            });

          
            return {
                success: true,
                eventos,
            };
        } catch (error) {
            
            return {
                success: false,
                error: 'Error al obtener eventos filtrados',
            };
        }
    },
});