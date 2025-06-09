// src/actions/index.ts

import { defineAction} from "astro:actions";
import { PrismaClient } from "@prisma/client";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { format } from "date-fns";
import { z } from 'zod';
import { getSession } from "auth-astro/server";

const prisma = new PrismaClient();


export const GenerarOrdenDePago = defineAction({
  input: z.object({
    inscripcionId: z.string().uuid(),
  }),

  handler: async ( input, context ) => {
    const { inscripcionId } = input;

    const session = await getSession(context.request);

    const inscripcion = await prisma.inscripciones.findUnique({
      where: { id_ins: inscripcionId },
      include: {
        usuarios: {
          include: {
            cuentas: { select: { cor_cue: true } },
            carreras: { select: { nom_car: true } },
          },
        },
        eventos: {
          include: {
            organizadores: true,
            categorias_eventos: { select: { nom_cat: true } },
          },
        },
      },
    });

    if (!inscripcion) {
      throw new Error("Inscripción no encontrada");
    }

    const { usuarios, eventos } = inscripcion;
    const nombreCompleto = `${usuarios.nom_usu1} ${usuarios.nom_usu2 || ''} ${usuarios.ape_usu1} ${usuarios.ape_usu2 || ''}`.trim();
    const organizador = `${eventos.organizadores.nom_org1} ${eventos.organizadores.ape_org1}`;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let y = height - 50;

    page.drawText('Orden de Pago', { x: 50, y, font: boldFont, size: 24, color: rgb(0.1, 0.1, 0.4) });
    y -= 40;

    page.drawText(`Número de Orden: ${inscripcion.id_ins}`, { x: 50, y, font: boldFont, size: 12 });
    y -= 20;
    page.drawText(`Fecha de Emisión: ${format(new Date(inscripcion.fec_ins), 'dd/MM/yyyy')}`, { x: 50, y, font, size: 12 });
    y -= 20;
    page.drawText(`Estado: ${inscripcion.est_ins.toUpperCase()}`, { x: 50, y, font, size: 12, color: rgb(0.8, 0.1, 0.1) });
    y -= 40;

    page.drawText('Dirigido a:', { x: 50, y, font: boldFont, size: 14 });
    y -= 20;
    page.drawText(`Nombre: ${nombreCompleto}`, { x: 50, y, font, size: 12 });
    y -= 20;
    page.drawText(`Cédula: ${usuarios.ced_usu}`, { x: 50, y, font, size: 12 });
    y -= 20;
    page.drawText(`Email: ${usuarios.cuentas[0]?.cor_cue || 'N/A'}`, { x: 50, y, font, size: 12 });
    y -= 40;

    page.drawText('Detalle del Cargo', { x: 50, y, font: boldFont, size: 14 });
    y -= 25;
    page.drawText('Concepto', { x: 60, y, font: boldFont, size: 12 });
    page.drawText('Valor', { x: width - 100, y, font: boldFont, size: 12 });
    y -= 10;
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 20;
    page.drawText(eventos.nom_eve, { x: 60, y, font, size: 12 });
    page.drawText(`$${Number(eventos.precio).toFixed(2)}`, { x: width - 100, y, font, size: 12 });
    y -= 10;
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 30;

    page.drawText('TOTAL A PAGAR:', { x: width - 200, y, font: boldFont, size: 16 });
    page.drawText(`$${Number(eventos.precio).toFixed(2)}`, { x: width - 100, y, font: boldFont, size: 16, color: rgb(0, 0.5, 0.1) });
    y -= 50;

    page.drawText('Instrucciones de Pago', { x: 50, y, font: boldFont, size: 14 });
    y -= 20;
    page.drawText('Realice el pago mediante transferencia bancaria a la siguiente cuenta:', { x: 50, y, font, size: 11 });
    y -= 15;
    page.drawText('Banco Pichincha - Cta. Ahorros: 220XXXXXX - A nombre de: Nombre Org. - RUC: 1234567890001', { x: 50, y, font, size: 11 });
    y -= 20;
    page.drawText('Una vez realizado el pago, suba el comprobante en el portal de inscripciones.', { x: 50, y, font, size: 11, color: rgb(0.5, 0, 0) });
    
    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    
    return {
      success: true,
      data: {
        pdfBase64: pdfBase64,
        fileName: `orden-pago-${inscripcion.id_ins}.pdf`,
      },
    };
  },
});