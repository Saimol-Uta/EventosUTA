import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';

export const getAllCarreras = defineAction({
    accept: 'json',
    input: z.object({}),
    async handler() {
        try {
            const carreras = await prisma.carreras.findMany({
                include: {
                    facultades: {
                        select: {
                            id_fac: true,
                            nom_fac: true,
                            des_fac: true
                        }
                    },
                    detalle_asignaciones: {
                        include: {
                            asignaciones: {
                                select: {
                                    id_asi: true,
                                    nom_asi: true,
                                    des_asi: true
                                }
                            }
                        }
                    },
                    usuarios: {
                        select: {
                            cor_cue: true,
                            nom_usu1: true,
                            nom_usu2: true,
                            ape_usu1: true,
                            ape_usu2: true,
                            ced_usu: true,
                            rol_cue: true
                        }
                    }
                },
                orderBy: {
                    nom_car: 'asc'
                }
            });

            // Convertir a objetos planos para serialización
            const carrerasSerializables = carreras.map(carrera => ({
                id_car: carrera.id_car,
                nom_car: carrera.nom_car,
                des_car: carrera.des_car,
                cod_car: carrera.cod_car,
                facultad: carrera.facultades ? {
                    id_fac: carrera.facultades.id_fac,
                    nom_fac: carrera.facultades.nom_fac,
                    des_fac: carrera.facultades.des_fac
                } : null,
                asignaciones: carrera.detalle_asignaciones.map(detalle => ({
                    id_asi: detalle.asignaciones.id_asi,
                    nom_asi: detalle.asignaciones.nom_asi,
                    des_asi: detalle.asignaciones.des_asi
                })),
                usuarios: carrera.usuarios.map(usuario => ({
                    cor_cue: usuario.cor_cue,
                    nombre_completo: `${usuario.nom_usu1} ${usuario.nom_usu2 || ''}`.trim(),
                    apellido_completo: `${usuario.ape_usu1} ${usuario.ape_usu2 || ''}`.trim(),
                    ced_usu: usuario.ced_usu,
                    rol_cue: usuario.rol_cue
                })),
                total_usuarios: carrera.usuarios.length
            }));

            return {
                success: true,
                carreras: carrerasSerializables
            };
        } catch (error) {
            console.error('Error al obtener carreras:', error);
            return {
                success: false,
                error: 'Error al obtener las carreras'
            };
        }
    }
});

export const getCarreraById = defineAction({
    accept: 'json',
    input: z.object({
        id_car: z.string().uuid('ID de carrera inválido'),
    }),
    async handler(input) {
        try {
            const carrera = await prisma.carreras.findUnique({
                where: { id_car: input.id_car },
                include: {
                    facultades: {
                        select: {
                            id_fac: true,
                            nom_fac: true,
                            des_fac: true
                        }
                    },
                    detalle_asignaciones: {
                        include: {
                            asignaciones: {
                                select: {
                                    id_asi: true,
                                    nom_asi: true,
                                    des_asi: true,
                                    tip_asi: true
                                }
                            }
                        }
                    },
                    usuarios: {
                        select: {
                            cor_cue: true,
                            nom_usu1: true,
                            nom_usu2: true,
                            ape_usu1: true,
                            ape_usu2: true,
                            ced_usu: true,
                            rol_cue: true
                        }
                    }
                }
            });

            if (!carrera) {
                return {
                    success: false,
                    error: 'Carrera no encontrada'
                };
            }

            // Convertir a objeto plano para serialización
            const carreraSerializable = {
                id_car: carrera.id_car,
                nom_car: carrera.nom_car,
                des_car: carrera.des_car,
                cod_car: carrera.cod_car,
                id_fac_per: carrera.id_fac_per,
                facultad: carrera.facultades ? {
                    id_fac: carrera.facultades.id_fac,
                    nom_fac: carrera.facultades.nom_fac,
                    des_fac: carrera.facultades.des_fac
                } : null,
                asignaciones: carrera.detalle_asignaciones.map(detalle => ({
                    id_asi: detalle.asignaciones.id_asi,
                    nom_asi: detalle.asignaciones.nom_asi,
                    des_asi: detalle.asignaciones.des_asi,
                    tip_asi: detalle.asignaciones.tip_asi
                })),
                usuarios: carrera.usuarios.map(usuario => ({
                    cor_cue: usuario.cor_cue,
                    nombre_completo: `${usuario.nom_usu1} ${usuario.nom_usu2 || ''}`.trim(),
                    apellido_completo: `${usuario.ape_usu1} ${usuario.ape_usu2 || ''}`.trim(),
                    ced_usu: usuario.ced_usu,
                    rol_cue: usuario.rol_cue
                })),
                total_usuarios: carrera.usuarios.length
            };

            return {
                success: true,
                carrera: carreraSerializable
            };
        } catch (error) {
            console.error('Error al obtener carrera:', error);
            return {
                success: false,
                error: 'Error al obtener la carrera'
            };
        }
    }
});
