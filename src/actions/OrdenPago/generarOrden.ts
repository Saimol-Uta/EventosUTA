// src/pages/api/orden-pago/[id].ts
import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns'; // Para formatear fechas: npm install date-fns

const prisma = new PrismaClient();

export const GET: APIRoute = async ({ params }) => {
  const inscripcionId = params.id;

  if (!inscripcionId) {
    return new Response('ID de inscripción no proporcionado', { status: 400 });
  }

  // 1. Obtener todos los datos con una sola consulta de Prisma
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
    return new Response('Inscripción no encontrada', { status: 404 });
  }

  // Extraer datos para fácil acceso
  const { usuarios, eventos } = inscripcion;
  const nombreCompleto = `${usuarios.nom_usu1} ${usuarios.nom_usu2 || ''} ${usuarios.ape_usu1} ${usuarios.ape_usu2 || ''}`.trim();
  const organizador = `${eventos.organizadores.nom_org1} ${eventos.organizadores.ape_org1}`;

  // 2. Crear el documento PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // --- DIBUJAR CONTENIDO EN EL PDF ---
  let y = height - 50;

  // Título
  page.drawText('Orden de Pago', { x: 50, y, font: boldFont, size: 24, color: rgb(0.1, 0.1, 0.4) });
  y -= 40;

  // Datos de la Orden
  page.drawText(`Número de Orden: ${inscripcion.id_ins}`, { x: 50, y, font: boldFont, size: 12 });
  y -= 20;
  page.drawText(`Fecha de Emisión: ${format(new Date(inscripcion.fec_ins), 'dd/MM/yyyy')}`, { x: 50, y, font, size: 12 });
  y -= 20;
  page.drawText(`Estado: ${inscripcion.est_ins.toUpperCase()}`, { x: 50, y, font, size: 12, color: rgb(0.8, 0.1, 0.1) });
  y -= 40;

  // Datos del Participante
  page.drawText('Dirigido a:', { x: 50, y, font: boldFont, size: 14 });
  y -= 20;
  page.drawText(`Nombre: ${nombreCompleto}`, { x: 50, y, font, size: 12 });
  y -= 20;
  page.drawText(`Cédula: ${usuarios.ced_usu}`, { x: 50, y, font, size: 12 });
  y -= 20;
  page.drawText(`Email: ${usuarios.cuentas[0]?.cor_cue || 'N/A'}`, { x: 50, y, font, size: 12 });
  y -= 40;

  // Tabla de Detalles del Evento
  page.drawText('Detalle del Cargo', { x: 50, y, font: boldFont, size: 14 });
  y -= 25;
  // Encabezados
  page.drawText('Concepto', { x: 60, y, font: boldFont, size: 12 });
  page.drawText('Valor', { x: width - 100, y, font: boldFont, size: 12 });
  y -= 10;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  y -= 20;
  // Cuerpo
  page.drawText(eventos.nom_eve, { x: 60, y, font, size: 12 });
  page.drawText(`$${Number(eventos.precio).toFixed(2)}`, { x: width - 100, y, font, size: 12 });
  y -= 10;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  y -= 30;

  // Total
  page.drawText('TOTAL A PAGAR:', { x: width - 200, y, font: boldFont, size: 16 });
  page.drawText(`$${Number(eventos.precio).toFixed(2)}`, { x: width - 100, y, font: boldFont, size: 16, color: rgb(0, 0.5, 0.1) });
  y -= 50;

  // Instrucciones de Pago
  page.drawText('Instrucciones de Pago', { x: 50, y, font: boldFont, size: 14 });
  y -= 20;
  page.drawText('Realice el pago mediante transferencia bancaria a la siguiente cuenta:', { x: 50, y, font, size: 11 });
  y -= 15;
  page.drawText('Banco Pichincha - Cta. Ahorros: 220XXXXXX - A nombre de: Nombre Org. - RUC: 1234567890001', { x: 50, y, font, size: 11 });
  y -= 20;
  page.drawText('Una vez realizado el pago, suba el comprobante en el portal de inscripciones.', { x: 50, y, font, size: 11, color: rgb(0.5, 0, 0) });
  
  // 3. Guardar el PDF a un buffer
  const pdfBytes = await pdfDoc.save();

  // 4. Retornar el buffer como una respuesta de la API
  return new Response(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="orden-pago-${inscripcion.id_ins}.pdf"`,
    },
  });
};