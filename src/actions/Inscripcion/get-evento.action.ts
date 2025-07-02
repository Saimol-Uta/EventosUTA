import { defineAction } from 'astro:actions';
import type { Eventos } from '../../interface';
import { z } from 'astro:schema';
import prisma from '../../db';


export const getEventosINS = defineAction({
    accept: 'json',
    input: z.object({
        activos: z.boolean().optional(),
    }),
    async handler(input) {
        try {
            const fechaActual = new Date();

            let whereClause = {};

            if (input.activos === true) {
                // Eventos que no han terminado (fecha fin mayor a la actual) y no están finalizados
                whereClause = {
                    fec_fin_eve: {
                        gte: fechaActual
                    },
                    estado_evento: {
                        not: "FINALIZADO"
                    }
                };
            } else if (input.activos === false) {
                // Eventos que ya terminaron (fecha fin menor a la actual) o están finalizados
                whereClause = {
                    OR: [
                        {
                            fec_fin_eve: {
                                lt: fechaActual
                            }
                        },
                        {
                            estado_evento: "FINALIZADO"
                        }
                    ]
                };
            } else {
                // Si no se recibe nada (undefined), mostrar solo eventos no finalizados por defecto
                whereClause = {
                    estado_evento: {
                        not: "FINALIZADO"
                    }
                };
            }

            const eventos = await prisma.eventos.findMany({
                where: whereClause,
                include: {
                    categorias_eventos: true,
                    organizadores: true,
                },
                orderBy: {
                    fec_ini_eve: 'desc'
                }
            });

            // Convertir a objetos planos usando JSON.parse(JSON.stringify())
            const eventosPlanos = JSON.parse(JSON.stringify(eventos));

            return {
                success: true,
                eventos: eventosPlanos
            };
        } catch (error) {
            console.error('Error al obtener eventos:', error);
            return {
                success: false,
                error: 'Error al obtener los eventos'
            };
        }
    }
});