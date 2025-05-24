import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const getEventoBySlug = defineAction({
    accept: 'json',
    input: z.string(),
    handler: async (slug) => {
        const evento = await prisma.eventos.findUnique({
            where: { id_eve: slug },
            include: {
                categorias_eventos: true,
                organizadores: true, // <-- Añadido aquí
                asignaciones: {
                    include: {
                        requisitos: true
                    }
                }
            }
        });

        if (!evento) {
            throw new Error('Evento not found');
        }

        return {
            evento: evento,
            categorias: evento.categorias_eventos,
            organizador: evento.organizadores, // <-- Añadido aquí
            asignaciones: evento.asignaciones.map((asignacion) => ({
                ...asignacion,
            })),
            requisitos: evento.asignaciones.flatMap((asignacion) => asignacion.requisitos),
        };
    },
});