import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { PDFFont, PDFPage, RGB } from 'pdf-lib';


export async function generarCertificadoPDF({
  nombreUsuario,
  nombreCurso,
  fechaInicio,
  fechaFin,
  duracionHoras,
  fechaGeneracion,
}: {
  nombreUsuario: string;
  nombreCurso: string;
  fechaInicio: string;
  fechaFin: string;
  duracionHoras: string;
  fechaGeneracion: string;
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([1920, 1080]);
  const { width, height } = page.getSize();
  const margin = 120;

  // Carga de assets (sin cambios)
  const plantillaPath = path.join(process.cwd(), 'public/img/Texto.png');
  const plantillaBytes = fs.readFileSync(plantillaPath);
  const plantillaImage = await pdfDoc.embedPng(plantillaBytes);
  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  const colors = {
    text: rgb(0.15, 0.15, 0.15),
    primary: rgb(0.56, 0.09, 0.13),
  };

  // Dibuja la plantilla (sin cambios)
  page.drawImage(plantillaImage, {
    x: 0,
    y: 0,
    width: width,
    height: height,
  });

  // --- Dibuja el texto dinámico con NUEVAS dimensiones y posiciones ---
  let currentY = 510; // <-- CAMBIO: Bajamos la posición inicial de todo el bloque

  // NOMBRE DEL PARTICIPANTE
  const nombreUsuarioText = nombreUsuario.toUpperCase();
  const nombreUsuarioWidth = titleFont.widthOfTextAtSize(nombreUsuarioText, 48); // <-- CAMBIO: Tamaño aumentado
  page.drawText(nombreUsuarioText, {
    x: (width - nombreUsuarioWidth) / 2,
    y: currentY,
    font: titleFont,
    size: 48, // <-- CAMBIO: Tamaño aumentado
    color: colors.text,
  });
  currentY -= 80; // <-- CAMBIO: Espaciado aumentado

  // "Por haber participado..."
  const textoParticipado = 'Por haber participado y aprobado el curso de:';
  const textoParticipadoWidth = bodyFont.widthOfTextAtSize(textoParticipado, 24); // <-- CAMBIO: Tamaño aumentado
  page.drawText(textoParticipado, {
    x: (width - textoParticipadoWidth) / 2,
    y: currentY,
    font: bodyFont,
    size: 24, // <-- CAMBIO: Tamaño aumentado
    color: colors.text,
  });
  currentY -= 60; // <-- CAMBIO: Espaciado aumentado

  // NOMBRE DEL CURSO/EVENTO
  const nombreCursoText = nombreCurso.toUpperCase();
  const nombreCursoWidth = titleFont.widthOfTextAtSize(nombreCursoText, 32); // <-- CAMBIO: Tamaño aumentado
  page.drawText(nombreCursoText, {
    x: (width - nombreCursoWidth) / 2,
    y: currentY,
    font: titleFont,
    size: 32, // <-- CAMBIO: Tamaño aumentado
    color: colors.primary,
  });
  currentY -= 60; // <-- CAMBIO: Espaciado aumentado

  // FECHAS Y DURACIÓN
  const combinedText = `del ${fechaInicio} al ${fechaFin}, con una duración de ${duracionHoras} horas académicas.`;
  const combinedTextWidth = bodyFont.widthOfTextAtSize(combinedText, 22); // <-- CAMBIO: Tamaño aumentado
  page.drawText(combinedText, {
    x: (width - combinedTextWidth) / 2,
    y: currentY,
    font: bodyFont,
    size: 22, // <-- CAMBIO: Tamaño aumentado
    color: colors.text,
  });
  currentY -= 120; // <-- CAMBIO: Espaciado aumentado

  // FECHA DE GENERACIÓN
  const generationDateText = `Ambato, ${fechaGeneracion}`;
  const dateTextWidth = bodyFont.widthOfTextAtSize(generationDateText, 22); // <-- CAMBIO: Tamaño aumentado
  page.drawText(generationDateText, {
    x: width - margin - dateTextWidth,
    y: currentY,
    font: bodyFont,
    size: 22, // <-- CAMBIO: Tamaño aumentado
    color: colors.text,
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}