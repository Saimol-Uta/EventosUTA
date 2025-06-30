import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const modificarCarrera = defineAction({
    accept: 'form',
    input: z.object({
        id_car: z.string().uuid('ID de carrera inválido'),
        nom_car: z.string().min(1, 'El nombre de la carrera es requerido').max(100, 'El nombre no puede exceder 100 caracteres'),
        des_car: z.string().min(1, 'La descripción es requerida').max(250, 'La descripción no puede exceder 250 caracteres'),
        id_fac_per: z.string().uuid('ID de facultad inválido'),
        cod_car: z.string().max(10, 'El código no puede exceder 10 caracteres').optional(),
    }),
    handler: async (form) => {
        try {
            // Verificar que la carrera existe
            const carreraExistente = await prisma.carreras.findUnique({
                where: { id_car: form.id_car }
            });

            if (!carreraExistente) {
                return {
                    success: false,
                    message: 'La carrera no existe'
                };
            }

            // Verificar que la facultad existe
            const facultadExistente = await prisma.facultades.findUnique({
                where: { id_fac: form.id_fac_per }
            });

            if (!facultadExistente) {
                return {
                    success: false,
                    message: 'La facultad seleccionada no existe'
                };
            }

            // Verificar si ya existe otra carrera con el mismo código (si se proporciona)
            if (form.cod_car) {
                const carreraConMismoCodigo = await prisma.carreras.findFirst({
                    where: {
                        cod_car: form.cod_car,
                        NOT: { id_car: form.id_car }
                    }
                });

                if (carreraConMismoCodigo) {
                    return {
                        success: false,
                        message: 'Ya existe otra carrera con este código'
                    };
                }
            }

            // Verificar si ya existe otra carrera con el mismo nombre en la misma facultad
            const carreraConMismoNombre = await prisma.carreras.findFirst({
                where: {
                    nom_car: form.nom_car,
                    id_fac_per: form.id_fac_per,
                    NOT: { id_car: form.id_car }
                }
            });

            if (carreraConMismoNombre) {
                return {
                    success: false,
                    message: 'Ya existe otra carrera con este nombre en la facultad seleccionada'
                };
            }

            // Actualizar la carrera
            const carreraActualizada = await prisma.carreras.update({
                where: { id_car: form.id_car },
                data: {
                    nom_car: form.nom_car,
                    des_car: form.des_car,
                    id_fac_per: form.id_fac_per,
                    cod_car: form.cod_car || null,
                },
                include: {
                    facultades: {
                        select: {
                            nom_fac: true
                        }
                    }
                }
            });

            return {
                success: true,
                message: 'Carrera actualizada correctamente',
                data: {
                    id: carreraActualizada.id_car,
                    nombre: carreraActualizada.nom_car,
                    codigo: carreraActualizada.cod_car,
                    facultad: carreraActualizada.facultades.nom_fac
                }
            };

        } catch (error: any) {
            console.error('Error al actualizar carrera:', error);

            // Manejo específico de errores de Prisma
            if (error.code === 'P2002') {
                const campo = error.meta?.target?.[0] || 'campo';
                return {
                    success: false,
                    message: `Ya existe una carrera con este ${campo === 'cod_car' ? 'código' : 'valor'}`
                };
            }

            if (error.code === 'P2025') {
                return {
                    success: false,
                    message: 'La carrera no fue encontrada'
                };
            }

            return {
                success: false,
                message: 'Error interno del servidor al actualizar la carrera'
            };
        }
    }
});
