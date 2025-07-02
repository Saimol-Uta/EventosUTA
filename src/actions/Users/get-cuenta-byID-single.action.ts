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
        const fechaActual = new Date();
        const eventosProximosPromise = prisma.eventos.findMany({
            where: { 
                fec_ini_eve: { gte: fechaActual },
                estado_evento: { not: 'FINALIZADO' } // Excluir eventos finalizados
            },
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
        // Aplicamos la misma lógica que en historial.astro
        const certificadosPromise = prisma.inscripciones.findMany({
            where: {
                id_usu_ins: idUsuario,
                est_par: 'APROBADA', // Solo participantes aprobados
                enl_cer_par: { not: null }, // Solo con certificado generado
            },
            include: {
                eventos: {
                    include: {
                        categorias_eventos: true, // Incluir la categoría para verificar si otorga certificados
                    }
                },
            },
            orderBy: { fec_cer_par: 'desc' },
        }).then(inscripciones => {
            // Filtrar solo aquellas donde:
            // 1. El evento ya finalizó
            // 2. La categoría otorga certificados
            // 3. Cumple los requisitos de la categoría
            const fechaActual = new Date();
            
            return inscripciones.filter(inscripcion => {
                const evento = inscripcion.eventos;
                const categoria = evento.categorias_eventos;
                
                // Verificar si el evento ya finalizó
                const eventoFinalizado = evento.fec_fin_eve ? evento.fec_fin_eve < fechaActual : false;
                if (!eventoFinalizado) return false;
                
                // Verificar si la categoría otorga certificados
                if (!categoria.brinda_certificado) return false;
                
                // Verificar requisitos de la categoría
                const asistenciaNum = inscripcion.asi_par ?? 0;
                const calificacionNum = inscripcion.not_par ? Number(inscripcion.not_par) : 0.0;
                
                const asistenciaMinimaRequerida = categoria.asi_cat ?? 70;
                const puntajeMinimoRequerido = categoria.pun_apr_cat ? Number(categoria.pun_apr_cat) : 7.0;
                
                // Verificar asistencia si es requerida
                if (categoria.requiere_asistencia && asistenciaNum < asistenciaMinimaRequerida) {
                    return false;
                }
                
                // Verificar puntaje si es requerido
                if (categoria.requiere_puntaje && calificacionNum < puntajeMinimoRequerido) {
                    return false;
                }
                
                return true;
            }).slice(0, 4); // Limitar a 4 para el dashboard
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