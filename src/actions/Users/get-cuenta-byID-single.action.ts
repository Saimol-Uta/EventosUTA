import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const getCuentaByIdSingle = defineAction({
    accept: 'json',
    input: z.string(),
    handler: async (correo_usuario) => {
        // Obtener usuario por correo electrónico
        const usuario = await prisma.usuarios.findFirst({
            where: { cor_cue: correo_usuario },
            include: {
                carreras: true
            }
        });
        return usuario;
    },
});

export const getDashboardData = defineAction({
    accept: 'json',
    input: z.object({
        idUsuario: z.string().optional(), // El id del usuario es opcional
    }),
    handler: async ({ idUsuario }) => {
        // 1. Preparamos la promesa para los eventos próximos (para todos los visitantes)
        const eventosProximosPromise = prisma.eventos.findMany({
            where: { fec_ini_eve: { gte: new Date() } },
            orderBy: { fec_ini_eve: 'asc' },
            take: 4, // Limitar a 4, como en tu frontend original
        });

        // 2. Si no hay un usuario logueado, devolvemos solo los datos públicos.
        if (!idUsuario) {
            const eventosProximos = await eventosProximosPromise;
            return {
                cuenta: null,
                eventosProximos,
                eventosUsuario: [],
                certificados: [],
            };
        }

        // 3. Si SÍ hay usuario, preparamos el resto de las promesas.

        // Promesa para los datos de la cuenta del usuario
        const cuentaPromise = prisma.usuarios.findUnique({
            where: { cor_cue: idUsuario },
            include: { carreras: true },
        });

        // Promesa para el HISTORIAL de eventos del usuario (todas sus inscripciones)
        const historialEventosPromise = prisma.inscripciones.findMany({
            where: { id_usu_ins: idUsuario },
            include: { eventos: true },
            orderBy: { eventos: { fec_ini_eve: 'desc' } }, // Ordenar por fecha de evento
        });

        // Promesa para los CERTIFICADOS del usuario
        // Es una consulta a la misma tabla 'inscripciones', pero filtrando
        // aquellas que SÍ tienen un enlace de certificado.
        const certificadosPromise = prisma.inscripciones.findMany({
            where: {
                id_usu_ins: idUsuario,
                enl_cer_par: {
                    not: null, // La clave: solo inscripciones con un enlace de certificado.
                },
            },
            include: {
                eventos: true, // Incluimos los datos del evento para mostrar el nombre.
            },
            take: 4, // Limitar a 4, como en tu frontend
        });


        // 4. Ejecutamos todas las promesas en paralelo para máxima eficiencia
        const [
            eventosProximos,
            cuenta,
            historialEventos,
            certificados,
        ] = await Promise.all([
            eventosProximosPromise,
            cuentaPromise,
            historialEventosPromise,
            certificadosPromise,
        ]);

        // 5. Devolvemos el objeto completo con los datos listos para usar
        return {
            cuenta,
            eventosProximos,
            eventosUsuario: historialEventos, // El historial completo de eventos/inscripciones
            certificados,                   // Solo las inscripciones que tienen certificado
        };
    },
});