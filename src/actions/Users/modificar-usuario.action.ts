import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import db from "@/db";

export const modificarUsuario = defineAction({
    accept: "form",
    input: z.object({
        cedula: z.string().min(1, "La cédula es requerida"),
        primerNombre: z.string().min(1, "El primer nombre es requerido"),
        segundoNombre: z.string().optional(),
        primerApellido: z.string().min(1, "El primer apellido es requerido"),
        segundoApellido: z.string().optional(),
        telefono: z.string().optional(),
        carreraId: z.string().min(1, "La carrera es requerida"),
        fechaNacimiento: z.string().min(1, "La fecha de nacimiento es requerida"),
    }),
    handler: async (input, context) => {
        try {
            const { cedula, ...updateData } = input;

            // Verificar que el usuario existe
            const usuarioExistente = await db.usuarios.findUnique({
                where: { ced_usu: cedula },
            });

            if (!usuarioExistente) {
                return {
                    success: false,
                    message: "El usuario no existe",
                };
            }

            // Verificar que la carrera existe
            const carreraExiste = await db.carreras.findUnique({
                where: { id_car: updateData.carreraId },
            });

            if (!carreraExiste) {
                return {
                    success: false,
                    message: "La carrera especificada no existe",
                };
            }

            // Actualizar el usuario
            const usuarioActualizado = await db.usuarios.update({
                where: { ced_usu: cedula },
                data: {
                    nom_usu1: updateData.primerNombre,
                    nom_usu2: updateData.segundoNombre || null,
                    ape_usu1: updateData.primerApellido,
                    ape_usu2: updateData.segundoApellido || null,
                    num_tel_usu: updateData.telefono || null,
                    id_car_per: updateData.carreraId,
                    fec_nac_usu: new Date(updateData.fechaNacimiento),
                },
                include: {
                    carreras: true,
                },
            });

            return {
                success: true,
                message: "Usuario actualizado exitosamente",
                data: usuarioActualizado,
            };
        } catch (error) {
            console.error("Error al actualizar usuario:", error);
            return {
                success: false,
                message: "Error interno del servidor al actualizar el usuario",
            };
        }
    },
});
