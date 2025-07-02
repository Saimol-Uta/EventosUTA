import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

/**
 * Obtener asignaciones plantilla (para usar en eventos)
 */
export const getAsignacionesPlantilla = defineAction({
    accept: 'json',
    input: z.object({}),
    async handler() {
        try {
            console.log('🚀 Iniciando getAsignacionesPlantilla...');

            // Buscar todas las asignaciones en el sistema
            console.log('🔍 Buscando todas las asignaciones disponibles...');
            const asignaciones = await prisma.asignaciones.findMany({
                include: {
                    detalle_asignaciones: {
                        include: {
                            carreras: true
                        }
                    },
                    eventos: true
                },
                orderBy: {
                    nom_asi: 'asc'
                }
            });

            console.log('📊 Total de asignaciones encontradas:', asignaciones.length);

            // Log detallado de cada asignación
            asignaciones.forEach((asig, index) => {
                console.log(`📝 Asignación ${index + 1}: "${asig.nom_asi}" (ID: ${asig.id_asi})`);
            });

            const asignacionesPlanas = JSON.parse(JSON.stringify(asignaciones));

            console.log('🎉 Retornando', asignacionesPlanas.length, 'asignaciones');

            return {
                success: true,
                asignaciones: asignacionesPlanas
            };
        } catch (error) {
            console.error('💥 Error al obtener asignaciones plantilla:', error);
            return {
                success: false,
                error: 'Error al obtener las asignaciones plantilla'
            };
        }
    }
});

/**
 * Vincular una asignación existente a un evento específico
 */
export const vincularAsignacionAEvento = defineAction({
    accept: 'json',
    input: z.object({
        id_asignacion: z.string(),
        id_evento: z.string()
    }),
    async handler(input) {
        return await vincularAsignacionHelper(input.id_asignacion, input.id_evento);
    }
});

/**
 * Función auxiliar reutilizable para vincular asignaciones
 */
async function vincularAsignacionHelper(id_asignacion: string, id_evento: string) {
    try {
        console.log('🔗 Vinculando asignación al evento...', { id_asignacion, id_evento });

        const result = await prisma.$transaction(async (tx) => {
            // Verificar que la asignación existe
            const asignacion = await tx.asignaciones.findUnique({
                where: { id_asi: id_asignacion }
            });

            if (!asignacion) {
                throw new Error('Asignación no encontrada');
            }

            // Verificar que el evento existe
            const evento = await tx.eventos.findUnique({
                where: { id_eve: id_evento }
            });

            if (!evento) {
                throw new Error('Evento no encontrado');
            }

            // Verificar si ya existe la relación
            if (evento.id_asi_eve === id_asignacion) {
                console.log('⚠️ La relación ya existe, saltando actualización');
                return { yaExistia: true, evento };
            }

            // Actualizar el evento para vincularlo con la asignación
            const eventoActualizado = await tx.eventos.update({
                where: { id_eve: id_evento },
                data: { id_asi_eve: id_asignacion }
            });

            console.log('✅ Relación creada exitosamente');
            return { yaExistia: false, evento: eventoActualizado };
        });

        return {
            success: true,
            yaExistia: result.yaExistia,
            evento: JSON.parse(JSON.stringify(result.evento))
        };
    } catch (error) {
        console.error('💥 Error al vincular asignación:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error al vincular la asignación'
        };
    }
}

/**
 * Duplicar/vincular asignación de plantilla a evento destino
 */
export const duplicarAsignacionesAEvento = defineAction({
    accept: 'json',
    input: z.object({
        id_asignacion_plantilla: z.string(),
        id_evento_destino: z.string()
    }),
    async handler(input) {
        console.log('🔗 Vinculando asignación existente al evento (sin duplicar)...');

        // Usar la función auxiliar para vincular
        const result = await vincularAsignacionHelper(
            input.id_asignacion_plantilla,
            input.id_evento_destino
        );

        if (!result.success) {
            return { success: false, error: result.error };
        }

        return {
            success: true,
            duplicada: !result.yaExistia,
            asignacion: { id_asi: input.id_asignacion_plantilla }
        };
    }
});

/**
 * Crear asignaciones de prueba para testing
 */
export const crearAsignacionesPrueba = defineAction({
    accept: 'json',
    input: z.object({}),
    async handler() {
        try {
            // Obtener una carrera existente
            const primerCarrera = await prisma.carreras.findFirst();

            // Crear asignaciones de prueba
            const asignacionesPrueba = [
                {
                    nom_asi: 'Estudiantes de Pregrado',
                    des_asi: 'Asignación para estudiantes de pregrado de todas las carreras',
                    tip_asi: 'ESTUDIANTES'
                },
                {
                    nom_asi: 'Profesionales TI',
                    des_asi: 'Asignación para profesionales del área de tecnología',
                    tip_asi: 'PROFESIONALES'
                },
                {
                    nom_asi: 'Docentes Universitarios',
                    des_asi: 'Asignación específica para docentes universitarios',
                    tip_asi: 'DOCENTES'
                }
            ];

            const asignacionesCreadas = [];

            for (const datosAsignacion of asignacionesPrueba) {
                // Verificar si ya existe
                const existe = await prisma.asignaciones.findFirst({
                    where: { nom_asi: datosAsignacion.nom_asi }
                });

                if (!existe) {
                    const nuevaAsignacion = await prisma.asignaciones.create({
                        data: datosAsignacion,
                        include: {
                            detalle_asignaciones: {
                                include: {
                                    carreras: true
                                }
                            },
                            eventos: true
                        }
                    });
                    asignacionesCreadas.push(nuevaAsignacion);
                }
            }

            return {
                success: true,
                mensaje: `Se crearon ${asignacionesCreadas.length} asignaciones de prueba`,
                asignaciones: JSON.parse(JSON.stringify(asignacionesCreadas))
            };
        } catch (error) {
            console.error('Error al crear asignaciones de prueba:', error);
            return {
                success: false,
                error: 'Error al crear asignaciones de prueba'
            };
        }
    }
});

/**
 * Desvincular asignación de un evento
 */
export const desvincularAsignacionDeEvento = defineAction({
    accept: 'json',
    input: z.object({
        id_evento: z.string()
    }),
    async handler(input) {
        try {
            const evento = await prisma.eventos.update({
                where: { id_eve: input.id_evento },
                data: { id_asi_eve: null }
            });

            return {
                success: true,
                mensaje: 'Asignación desvinculada del evento correctamente',
                evento: JSON.parse(JSON.stringify(evento))
            };
        } catch (error) {
            console.error('Error al desvincular asignación:', error);
            return {
                success: false,
                error: 'Error al desvincular la asignación del evento'
            };
        }
    }
});
