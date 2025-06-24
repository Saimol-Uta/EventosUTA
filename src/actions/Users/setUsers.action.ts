import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';
import { getSession } from 'auth-astro/server';

export const setUser = defineAction({
    accept: 'form',
    input: z.object({
        id_usu: z.string(), // El ID (correo) del usuario a actualizar. ¡Esencial!
        ced_usu: z.string().regex(/^\d{10}$/, "La cédula debe tener 10 dígitos."),
        nom_usu1: z.string().min(1, "El primer nombre es obligatorio."),
        nom_usu2: z.string().optional().nullable(),
        ape_usu1: z.string().min(1, "El primer apellido es obligatorio."),
        ape_usu2: z.string().optional().nullable(),
        fec_nac_usu: z.string().min(1, "La fecha de nacimiento es obligatoria."),
        num_tel_usu: z.string().regex(/^\d{10}$/, "El teléfono debe tener 10 dígitos."),
        id_car_per: z.string().optional().nullable(),
        cor_rec: z.string().email("El correo de recuperación no es válido.").optional().nullable(),
    }),
    handler: async (input, { request }) => {
        try {

            const datosParaActualizar = {
                ced_usu: input.ced_usu,
                nom_usu1: input.nom_usu1,
                nom_usu2: input.nom_usu2,
                ape_usu1: input.ape_usu1,
                ape_usu2: input.ape_usu2,
                // Prisma necesita un objeto Date, lo convertimos
                fec_nac_usu: new Date(input.fec_nac_usu), 
                num_tel_usu: input.num_tel_usu,
                id_car_per: input.id_car_per,
                cor_rec: input.cor_rec,
            };

            // ✅ 3. Usamos 'update' con el ID del usuario para una operación atómica y segura.
            // No hay necesidad de buscar primero. 'update' busca y actualiza.
            await prisma.usuarios.update({
                where: {
                    cor_cue: input.id_usu, // Buscamos por la llave primaria
                },
                data: datosParaActualizar, // Actualizamos con los nuevos datos
            });

            // Devolvemos un resultado de éxito
            return {
                success: true,
                value: { created: false, message: "Perfil actualizado con éxito." },
            };

        } catch (error) {
            console.error("Error en setUser:", error);
            // Si algo falla (ej: la base de datos está caída), devolvemos un error genérico.
            return {
                success: false,
                error: "No se pudieron guardar los cambios. Intente de nuevo.",
            };
        }
    },
});