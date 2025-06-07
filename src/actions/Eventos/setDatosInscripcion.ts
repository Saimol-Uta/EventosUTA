import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import prisma from "@/db";

export const setDatosInscripcion = defineAction({
  accept: "json",
  input: z.object({
    idUsuario: z.string().uuid(),
    idEvento: z.string().uuid(),
    metodoPago: z.string().optional(),
    enlaceComprobante: z.string().optional(),
  }),
  handler: async ({ idUsuario, idEvento, metodoPago, enlaceComprobante }) => {
    try {
      // 1. Obtener el usuario real desde la cuenta
      const cuenta = await prisma.cuentas.findUnique({
        where: { id_cue: idUsuario },
        include: { usuarios: true },
      });

      const usuario = cuenta?.usuarios;
      if (!usuario) {
        return {
          success: false,
          message: "No se encontró el usuario asociado a la cuenta.",
        };
      }

      const idUsu = usuario.id_usu;

      // 2. Verificar si ya está inscrito
      const existe = await prisma.inscripciones.findUnique({
        where: {
          id_usu_ins_id_eve_ins: {
            id_usu_ins: idUsu,
            id_eve_ins: idEvento,
          },
        },
      });

      if (existe) {
        return {
          success: false,
          message: "Ya estás inscrito en este evento.",
        };
      }

      // 3. Crear la inscripción
      const inscripcion = await prisma.inscripciones.create({
        data: {
          id_usu_ins: idUsu,
          id_eve_ins: idEvento,
          // Solo acepta los valores permitidos por la tabla
          met_pag_ins: metodoPago && ["TRANSFERENCIA", "DEPOSITO", "ONLINE"].includes(metodoPago) ? metodoPago : null,
          enl_ord_pag_ins: enlaceComprobante || null,
          est_par: "APROBADA",
        },
      });

      return {
        success: true,
        message: "Inscripción realizada correctamente.",
        inscripcion,
      };
    } catch (error) {
      console.error("Error al inscribir:", error);
      return {
        success: false,
        message: "Error al guardar la inscripción.",
      };
    }
  },
});