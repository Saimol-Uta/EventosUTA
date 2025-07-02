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
                organizadores: true,
                asignaciones: {
                    include: {
                        detalle_asignaciones: {
                            include: {
                                carreras: true,
                            },
                        },
                    },
                },
            },
        });

        if (!evento) {
            throw new Error('Evento no encontrado');
        }

        // Extraer información de la asignación y las carreras asociadas
        const asignacion = evento.asignaciones;
        const carrerasAsignacion = asignacion?.detalle_asignaciones?.map(det => det.carreras) || [];

        return {
            evento,
            categoria: evento.categorias_eventos,
            organizador: evento.organizadores,
            asignacion,
            carreras_asignacion: carrerasAsignacion,
        };
    },
});
