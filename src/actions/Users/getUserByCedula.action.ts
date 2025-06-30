import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import prisma from '../../db';
import type { Prisma } from '@prisma/client';

export type Usuario = Prisma.usuariosGetPayload<{
    select: {
        cor_cue: true,
        ced_usu: true,
        nom_usu1: true,
        nom_usu2: true,
        ape_usu1: true,
        ape_usu2: true,
        fec_nac_usu: true,
        num_tel_usu: true,
        id_car_per: true,
        cor_rec: true,
    }
}>;

export const getUserByCedula = defineAction({
  accept: 'json',
    input: z.object({
        // Solo necesitamos el ID del usuario (que es su correo)
        idUsuario: z.string(),
    }),
    handler: async ({ idUsuario }) => {
        try {
            // Buscamos directamente por la llave primaria. Es la consulta más rápida posible.
            const usuario = await prisma.usuarios.findUnique({
                where: {
                    cor_cue: idUsuario,
                },
                // Seleccionamos los mismos campos que antes
                select: {
                    cor_cue: true,
                    ced_usu: true,
                    nom_usu1: true,
                    nom_usu2: true,
                    ape_usu1: true,
                    ape_usu2: true,
                    fec_nac_usu: true,
                    num_tel_usu: true,
                    id_car_per: true,
                    cor_rec: true, // Incluimos el correo de recuperación que necesitas
                    enl_ced_cue: true,
                },
            });

            if (!usuario) {
                return { success: false, error: 'Perfil de usuario no encontrado.' };
            }

            return { success: true, usuario: usuario };

        } catch (error) {
            console.error("Error en getUsuarioParaPerfil:", error);
            return { success: false, error: "Error al obtener el perfil del usuario." };
        }
    },
});