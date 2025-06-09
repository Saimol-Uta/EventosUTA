import { defineAction } from 'astro:actions';
import type { Eventos } from '../../interface';
import { z } from 'astro:schema';
import prisma from '../../db';


export const getEventos = defineAction({
    accept: 'json',
    handler: async () => {
        try {
            const eventos = await prisma.eventos.findMany({
                orderBy: {
                    nom_eve: 'asc'
                }
            });
            return {
                success: true,
                eventos: eventos as Eventos[]
            };
        } catch (error) {
            return {
                success: false,
                error: 'Error al obtener los eventos'
            };
        }
    },
});