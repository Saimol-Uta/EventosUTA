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

  // --- CAMBIO 1: FUENTE DE LETRA ---
  // Cambiamos Helvetica por Times New Roman para un estilo más formal.
  const nameFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
  const titleFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const bodyFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  
  const colors = {
    text: rgb(0.15, 0.15, 0.15),
    primary: rgb(0.56, 0.09, 0.13),
  };

  page.drawImage(plantillaImage, {
    x: 0,
    y: 0,
    width: width,
    height: height,
  });

  // --- CAMBIO 2: TAMAÑOS Y POSICIONES ---
  let currentY = 550; // Mantenemos la posición vertical que te gustó

  // NOMBRE DEL PARTICIPANTE
  const nombreUsuarioText = nombreUsuario.toUpperCase();
  // Usamos el mismo tamaño (52), pero con la nueva fuente en cursiva
  const nombreUsuarioWidth = nameFont.widthOfTextAtSize(nombreUsuarioText, 52); 
  page.drawText(nombreUsuarioText, {
    x: (width - nombreUsuarioWidth) / 2,
    y: currentY,
    font: nameFont, // <-- CAMBIO: Usamos la fuente en cursiva
    size: 52, 
    color: colors.text,
  });
  currentY -= 90; // Aumentamos espaciado

  // "Por haber participado..."
  const textoParticipado = 'Por haber participado y aprobado el curso de:';
  const textoParticipadoWidth = bodyFont.widthOfTextAtSize(textoParticipado, 30); // <-- CAMBIO: Tamaño aumentado
  page.drawText(textoParticipado, {
    x: (width - textoParticipadoWidth) / 2,
    y: currentY,
    font: bodyFont,
    size: 30, // <-- CAMBIO: Tamaño aumentado
    color: colors.text,
  });
  currentY -= 75; // Aumentamos espaciado

  // NOMBRE DEL CURSO/EVENTO
  const nombreCursoText = nombreCurso.toUpperCase();
  const nombreCursoWidth = titleFont.widthOfTextAtSize(nombreCursoText, 40); // <-- CAMBIO: Tamaño aumentado
  page.drawText(nombreCursoText, {
    x: (width - nombreCursoWidth) / 2,
    y: currentY,
    font: titleFont, // Mantenemos la fuente en negrita normal
    size: 40, // <-- CAMBIO: Tamaño aumentado
    color: colors.primary,
  });
  currentY -= 75; // Aumentamos espaciado

  // FECHAS Y DURACIÓN
  const combinedText = `del ${fechaInicio} al ${fechaFin}, con una duración de ${duracionHoras} horas académicas.`;
  const combinedTextWidth = bodyFont.widthOfTextAtSize(combinedText, 30); // <-- CAMBIO: Tamaño aumentado
  page.drawText(combinedText, {
    x: (width - combinedTextWidth) / 2,
    y: currentY,
    font: bodyFont,
    size: 30, // <-- CAMBIO: Tamaño aumentado
    color: colors.text,
  });
  currentY -= 140; // Aumentamos espaciado

  // FECHA DE GENERACIÓN
  const rightMarginForDate = 280;
  const generationDateText = `Ambato, ${fechaGeneracion}`;
  const dateTextWidth = bodyFont.widthOfTextAtSize(generationDateText, 28); // <-- CAMBIO: Tamaño aumentado
  page.drawText(generationDateText, {
    x: width - rightMarginForDate - dateTextWidth,
    y: currentY,
    font: bodyFont,
    size: 28, // <-- CAMBIO: Tamaño aumentado
    color: colors.text,
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}