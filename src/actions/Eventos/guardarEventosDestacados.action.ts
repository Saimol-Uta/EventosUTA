import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const guardarEventosDestacados = defineAction({
    accept: 'json',
    input: z.object({
        eventosIds: z.array(z.string()).min(1, 'Debe seleccionar al menos un evento')
    }),
    async handler({ eventosIds }) {
        try {
            console.log('Guardando eventos destacados:', eventosIds);

            // Verificar que todos los eventos existen
            const eventosExistentes = await prisma.eventos.findMany({
                where: {
                    id_eve: {
                        in: eventosIds
                    }
                },
                select: {
                    id_eve: true,
                    nom_eve: true
                }
            });

            if (eventosExistentes.length !== eventosIds.length) {
                const idsExistentes = eventosExistentes.map(e => e.id_eve);
                const idsNoEncontrados = eventosIds.filter(id => !idsExistentes.includes(id));
                console.error('Eventos no encontrados:', idsNoEncontrados);

                return {
                    success: false,
                    error: `Algunos eventos no fueron encontrados: ${idsNoEncontrados.join(', ')}`
                };
            }

            // Primero, desmarcar todos los eventos como no destacados
            await prisma.eventos.updateMany({
                where: {
                    es_destacado: true
                },
                data: {
                    es_destacado: false
                }
            });

            // Luego, marcar los eventos seleccionados como destacados
            const resultado = await prisma.eventos.updateMany({
                where: {
                    id_eve: {
                        in: eventosIds
                    }
                },
                data: {
                    es_destacado: true
                }
            });

            console.log(`${resultado.count} eventos marcados como destacados`);

            // Obtener los nombres de los eventos actualizados para el mensaje
            const eventosActualizados = await prisma.eventos.findMany({
                where: {
                    id_eve: {
                        in: eventosIds
                    }
                },
                select: {
                    nom_eve: true
                }
            });

            const nombresEventos = eventosActualizados.map(e => e.nom_eve).join(', ');

            return {
                success: true,
                message: `${resultado.count} evento(s) guardado(s) como destacado(s) exitosamente`,
                data: {
                    eventosActualizados: resultado.count,
                    eventosDestacados: eventosActualizados,
                    nombresEventos
                }
            };

        } catch (error) {
            console.error('Error al guardar eventos destacados:', error);

            return {
                success: false,
                error: error instanceof Error
                    ? `Error al guardar eventos destacados: ${error.message}`
                    : 'Error desconocido al guardar eventos destacados'
            };
        }
    }
});
