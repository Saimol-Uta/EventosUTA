import * as fs from 'fs';
// Importaciones de valores y tipos separadas para compatibilidad
import { PDFDocument, rgb } from 'pdf-lib';
import type { PDFFont, PDFPage, RGB } from 'pdf-lib';

// --- Función de ayuda para centrar texto (muy útil para este diseño) ---
function drawTextCentered(
  page: PDFPage,
  text: string,
  options: {
    font: PDFFont;
    size: number;
    y: number;
    color?: RGB;
  }
) {
  const textWidth = options.font.widthOfTextAtSize(text, options.size);
  const pageWidth = page.getWidth();
  page.drawText(text, {
    x: (pageWidth - textWidth) / 2,
    ...options,
  });
}

// --- La firma de la función ahora es más descriptiva ---
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
  fechaInicio: string; // Ejemplo: "22 de septiembre"
  fechaFin: string; // Ejemplo: "29 de septiembre de 2023"
  duracionHoras: string;
  fechaGeneracion: string; // Ejemplo: "7 de junio de 2025"
}) {
  const pdfDoc = await PDFDocument.create();
  // Usamos A4 en horizontal para que coincida con tu plantilla
  const page = pdfDoc.addPage([841.89, 595.28]);
  const { width, height } = page.getSize();
  const margin = 50;

  // --- Carga de Assets ---
  const plantillaBytes = fs.readFileSync('./assets/Texto.png');
  const fontBoldBytes = fs.readFileSync('./assets/fonts/Montserrat-Bold.ttf');
  const fontRegularBytes = fs.readFileSync('./assets/fonts/Montserrat-Regular.ttf');
  
  // --- Incrustar Assets ---
  const plantillaImage = await pdfDoc.embedPng(plantillaBytes);
  const titleFont = await pdfDoc.embedFont(fontBoldBytes);
  const bodyFont = await pdfDoc.embedFont(fontRegularBytes);
  
  const colors = {
    text: rgb(0.15, 0.15, 0.15), // Un gris oscuro para buena legibilidad
    primary: rgb(0.56, 0.09, 0.13), // El color vino/rojo de tu plantilla
  };

  // 1. Dibuja tu plantilla como fondo
  page.drawImage(plantillaImage, {
    x: 0,
    y: 0,
    width: width,
    height: height,
  });

  // --- 2. Dibuja el texto dinámico en el orden solicitado ---
  let currentY = 320; // Posición vertical inicial (ajústala si es necesario)

  // NOMBRE DEL PARTICIPANTE
  drawTextCentered(page, nombreUsuario.toUpperCase(), {
    font: titleFont,
    size: 28,
    y: currentY,
    color: colors.text,
  });
  currentY -= 45; // Aumentar espacio después del nombre

  // "Por haber participado..."
  drawTextCentered(page, 'Por haber participado y aprobado el curso de:', {
    font: bodyFont,
    size: 14,
    y: currentY,
    color: colors.text,
  });
  currentY -= 30;

  // NOMBRE DEL CURSO/EVENTO
  drawTextCentered(page, nombreCurso.toUpperCase(), {
    font: titleFont,
    size: 16,
    y: currentY,
    color: colors.primary, // Usamos el color primario para destacarlo
  });
  currentY -= 30;

  // FECHAS
  const dateRangeText = `del ${fechaInicio} al ${fechaFin}`;
  drawTextCentered(page, dateRangeText, {
    font: bodyFont,
    size: 12,
    y: currentY,
    color: colors.text,
  });
  currentY -= 20;

  // DURACIÓN
  const durationText = `con una duración de ${duracionHoras} horas académicas.`;
  drawTextCentered(page, durationText, {
    font: bodyFont,
    size: 12,
    y: currentY,
    color: colors.text,
  });
  currentY -= 60; // Más espacio antes de la fecha final

  // FECHA DE GENERACIÓN (Alineada a la derecha)
  const generationDateText = `Ambato, ${fechaGeneracion}`;
  const dateTextWidth = bodyFont.widthOfTextAtSize(generationDateText, 12);
  page.drawText(generationDateText, {
    x: width - margin - dateTextWidth,
    y: currentY,
    font: bodyFont,
    size: 12,
    color: colors.text,
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}