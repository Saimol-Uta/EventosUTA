import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const getFiltrosDinamicos = defineAction({
    accept: 'json',
    input: z.object({}),
    handler: async () => {
        try {
            // Obtener todas las carreras únicas que tienen eventos asignados
            const carreras = await prisma.carreras.findMany({
                select: {
                    nom_car: true,
                },
                where: {
                    detalle_asignaciones: {
                        some: {
                            asignaciones: {
                                eventos: {
                                    some: {} // Solo carreras que tienen eventos asignados
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    nom_car: 'asc'
                }
            });

            // Obtener todas las áreas únicas que tienen eventos con conteo
            const areasQuery = await prisma.eventos.groupBy({
                by: ['are_eve'],
                where: {
                    are_eve: {
                        not: null
                    }
                },
                _count: {
                    are_eve: true
                },
                orderBy: {
                    are_eve: 'asc'
                }
            });

            // Obtener rangos de duración basados en los datos reales
            const duraciones = await prisma.eventos.findMany({
                select: {
                    dur_eve: true,
                },
                where: {
                    dur_eve: {
                        not: null
                    }
                },
                orderBy: {
                    dur_eve: 'asc'
                }
            });

            // Crear rangos dinámicos de duración
            const rangosDuracion = [];
            const horasUnicas = duraciones.map(d => d.dur_eve).filter((h): h is number => h !== null);
            
            if (horasUnicas.length > 0) {
                const minHoras = Math.min(...horasUnicas);
                const maxHoras = Math.max(...horasUnicas);

                // Crear rangos basados en los datos reales con mejor distribución
                const horasOrdenadas = [...new Set(horasUnicas)].sort((a, b) => a - b);
                
                // Rangos dinámicos más específicos basados en los datos reales
                const eventosCount = await prisma.eventos.count;
                
                if (horasOrdenadas.some(h => h < 100)) {
                    const count = await prisma.eventos.count({ where: { dur_eve: { lt: 100 } } });
                    rangosDuracion.push({ 
                        label: `Menos de 100 horas (${count} eventos)`, 
                        value: "Menos de 100 horas" 
                    });
                }
                if (horasOrdenadas.some(h => h >= 100 && h < 500)) {
                    const count = await prisma.eventos.count({ where: { dur_eve: { gte: 100, lte: 500 } } });
                    rangosDuracion.push({ 
                        label: `100 - 500 horas (${count} eventos)`, 
                        value: "100 - 500 horas" 
                    });
                }
                if (horasOrdenadas.some(h => h >= 500 && h < 1000)) {
                    const count = await prisma.eventos.count({ where: { dur_eve: { gte: 500, lte: 1000 } } });
                    rangosDuracion.push({ 
                        label: `500 - 1000 horas (${count} eventos)`, 
                        value: "500 - 1000 horas" 
                    });
                }
                if (horasOrdenadas.some(h => h >= 1000)) {
                    const count = await prisma.eventos.count({ where: { dur_eve: { gt: 1000 } } });
                    rangosDuracion.push({ 
                        label: `Más de 1000 horas (${count} eventos)`, 
                        value: "Más de 1000 horas" 
                    });
                }

                return {
                    success: true,
                    data: {
                        carreras: carreras.map(c => c.nom_car).filter(Boolean),
                        areas: areasQuery.map(a => a.are_eve).filter(Boolean),
                        rangosDuracion,
                        estadisticas: {
                            totalCarreras: carreras.length,
                            totalAreas: areasQuery.length,
                            duracionMinima: minHoras,
                            duracionMaxima: maxHoras,
                            totalEventos: await prisma.eventos.count()
                        }
                    }
                };
            } else {
                return {
                    success: true,
                    data: {
                        carreras: carreras.map(c => c.nom_car).filter(Boolean),
                        areas: areasQuery.map(a => a.are_eve).filter(Boolean),
                        rangosDuracion: [],
                        estadisticas: {
                            totalCarreras: carreras.length,
                            totalAreas: areasQuery.length,
                            duracionMinima: 0,
                            duracionMaxima: 0,
                            totalEventos: await prisma.eventos.count()
                        }
                    }
                };
            }
        } catch (error) {
            console.error("Error al obtener filtros dinámicos:", error);
            return {
                success: false,
                error: 'Error al obtener filtros dinámicos'
            };
        }
    },
});
