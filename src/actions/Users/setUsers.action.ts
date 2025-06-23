import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';
import { getSession } from 'auth-astro/server';

export const setUser = defineAction({
    accept: 'form',
    input: z.object({
        id_usu: z.string().optional(),
        ced_usu: z.string().length(10),
        nom_usu1: z.string(),
        nom_usu2: z.string().optional().nullable(),
        ape_usu1: z.string(),
        ape_usu2: z.string(),
        fec_nac_usu: z.string().nullable().optional(),
        num_tel_usu: z.string().optional().nullable(),
        id_car_per: z.string().optional().nullable(),
        // NO incluyas cont_cuenta aquí
    }),
    handler: async (input, { request }) => {
        try {
            const session = await getSession(request);
            const correoSesion = session?.user?.email;
            if (!correoSesion) {
                throw new Error("No se pudo obtener el correo de la sesión.");
            }

            let fechaValida: Date;
            if (input.fec_nac_usu) {
                const fecha = new Date(input.fec_nac_usu);
                fechaValida = !isNaN(fecha.getTime()) ? fecha : new Date("1900-01-01");
            } else {
                fechaValida = new Date("1900-01-01");
            }

            // Buscar usuario por cédula o correo
            let existingUser = null;
            if (input.ced_usu) {
                existingUser = await prisma.usuarios.findUnique({
                    where: { ced_usu: input.ced_usu },
                });
            }
            if (!existingUser && correoSesion) {
                existingUser = await prisma.usuarios.findUnique({
                    where: { cor_cue: correoSesion },
                });
            }

            let rol_cue = "USUARIO";
            if (correoSesion.endsWith("@uta.edu.ec")) {
                rol_cue = "ESTUDIANTE";
            }

            const dataToSave = {
                // cor_cue: correoSesion, // No lo actualices, solo úsalo para buscar
                ced_usu: input.ced_usu,
                nom_usu1: input.nom_usu1,
                nom_usu2: input.nom_usu2 ?? null,
                ape_usu1: input.ape_usu1,
                ape_usu2: input.ape_usu2,
                fec_nac_usu: fechaValida,
                num_tel_usu: input.num_tel_usu ?? null,
                id_car_per: input.id_car_per ?? null,
                rol_cue,
            };

            let usuarioFinal;
            if (existingUser) {
                usuarioFinal = await prisma.usuarios.update({
                    where: existingUser.cor_cue
                        ? { cor_cue: existingUser.cor_cue }
                        : { ced_usu: existingUser.ced_usu },
                    data: dataToSave, // sin cor_cue ni cont_cuenta
                });
            } else {
                // Solo al crear usuario, debes pedir la contraseña y el correo
                throw new Error("El usuario no existe. No se puede actualizar.");
            }

            return {
                success: true,
                created: false,
                requireReauth: true
            };
        } catch (error) {
            console.error("Error en setUser:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Error guardando usuario. Intente de nuevo.",
            };
        }
    },
});
