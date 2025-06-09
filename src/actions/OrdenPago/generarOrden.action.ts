import { defineAction} from "astro:actions";
import prisma from '../../db';
import { 
  PDFDocument, 
  rgb, 
  StandardFonts 
} from "pdf-lib";
import type { 
  PDFFont, 
  PDFPageDrawTextOptions 
} from "pdf-lib";
import { format } from "date-fns";
import { z } from 'zod';
import { getSession } from "auth-astro/server";

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
    const organizadorNombre = `${eventos.organizadores.nom_org1} ${eventos.organizadores.ape_org1}`;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 50;
    const mainColor = rgb(0.1, 0.1, 0.4);
    const accentColor = rgb(0.8, 0.1, 0.1);
    
    const drawTextRight = (
      text: string, 
      options: Omit<PDFPageDrawTextOptions, 'x'> & { font: PDFFont; size: number }
    ) => {
      const textWidth = options.font.widthOfTextAtSize(text, options.size);
      page.drawText(text, { ...options, x: width - margin - textWidth });
    };

    let y = height - margin;
    page.drawText('Orden de Pago', { x: margin, y, font: boldFont, size: 28, color: mainColor });
    y -= 50;
    
    page.drawText(`Número de Orden:`, { x: margin, y, font: boldFont, size: 10 });
    page.drawText(inscripcion.id_ins, { x: margin + 95, y, font: font, size: 10 });
    y -= 15;
    page.drawText(`Fecha de Emisión:`, { x: margin, y, font: boldFont, size: 10 });
    page.drawText(format(new Date(inscripcion.fec_ins), 'dd/MM/yyyy'), { x: margin + 95, y, font: font, size: 10 });
    y -= 15;
    page.drawText(`Estado:`, { x: margin, y, font: boldFont, size: 10 });
    page.drawText(inscripcion.est_ins.toUpperCase(), { x: margin + 95, y, font: boldFont, size: 10, color: accentColor });
    let yCol2 = height - margin - 50;
    drawTextRight(`Emitido por:`, { y: yCol2, font: boldFont, size: 10 });
    yCol2 -= 15;
    drawTextRight(organizadorNombre, { y: yCol2, font: font, size: 10 });
    yCol2 -= 15;
    drawTextRight(`RUC: ${eventos.organizadores.ced_org}001`, { y: yCol2, font: font, size: 10 });
    y -= 40;
    page.drawText('Dirigido a:', { x: margin, y, font: boldFont, size: 12, color: mainColor });
    y -= 20;
    page.drawText(nombreCompleto, { x: margin, y, font: font, size: 11 });
    y -= 15;
    page.drawText(`Cédula: ${usuarios.ced_usu}`, { x: margin, y, font: font, size: 11 });
    y -= 15;
    page.drawText(`Email: ${usuarios.cuentas[0]?.cor_cue || 'N/A'}`, { x: margin, y, font: font, size: 11 });
    y -= 40;
    const tableTop = y + 10;
    page.drawRectangle({ x: margin, y: y-50, width: width - (margin * 2), height: 80, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1.5 });
    page.drawText('Concepto', { x: margin + 15, y: tableTop, font: boldFont, size: 12, color: mainColor });
    drawTextRight('Valor', { y: tableTop, font: boldFont, size: 12, color: mainColor });
    y -= 25;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 20;
    page.drawText(eventos.nom_eve, { x: margin + 15, y, font: font, size: 11 });
    drawTextRight(`$${Number(eventos.precio).toFixed(2)}`, { y, font: font, size: 11 });
    y -= 45;
    drawTextRight('TOTAL A PAGAR:', { y, font: boldFont, size: 16, color: mainColor });
    page.drawText(`$${Number(eventos.precio).toFixed(2)}`, { x: width - margin - 65, y, font: boldFont, size: 16, color: rgb(0, 0.5, 0.1) });
    y -= 60;
    page.drawText('Formas de Pago', { x: margin, y, font: boldFont, size: 12, color: mainColor });
    y -= 25;
    page.drawText('Pago en Secretaría', { x: margin, y, font: boldFont, size: 11 });
    y -= 18;
    const lugarLabel = 'Lugar: ';
    page.drawText(lugarLabel, { x: margin, y, font: boldFont, size: 10, color: rgb(0.4, 0.4, 0.4) });
    page.drawText('Secretaría de la FISEI', { x: margin + boldFont.widthOfTextAtSize(lugarLabel, 10), y, font: font, size: 10 });
    y -= 30;
    page.drawText('Transferencia Bancaria', { x: margin, y, font: boldFont, size: 11 });
    y -= 18;
    const bancoLabel = 'Banco: ';
    const cuentaLabel = 'Cuenta: ';
    page.drawText(bancoLabel, { x: margin, y, font: boldFont, size: 10, color: rgb(0.4, 0.4, 0.4) });
    page.drawText('Banco Pichincha', { x: margin + boldFont.widthOfTextAtSize(bancoLabel, 10), y, font: font, size: 10 });
    y -= 15;
    page.drawText(cuentaLabel, { x: margin, y, font: boldFont, size: 10, color: rgb(0.4, 0.4, 0.4) });
    page.drawText('Corriente #2206674884', { x: margin + boldFont.widthOfTextAtSize(cuentaLabel, 10), y, font: font, size: 10 });
    y -= 30;
    page.drawText('Para pagos por transferencia, suba el comprobante en el portal de inscripciones.', { x: margin, y, font: font, size: 10, color: accentColor });
    const footerY = margin;
    page.drawLine({ start: {x: margin, y: footerY + 10}, end: {x: width - margin, y: footerY + 10}, thickness: 1, color: rgb(0.8, 0.8, 0.8)});
    const footerText = `Gracias por su inscripción. Para soporte, contacte a soporte@evento.com`;
    const footerTextWidth = font.widthOfTextAtSize(footerText, 8);
    page.drawText(footerText, { x: (width - footerTextWidth) / 2, y: footerY - 10, size: 8, font: font, color: rgb(0.5, 0.5, 0.5) });

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