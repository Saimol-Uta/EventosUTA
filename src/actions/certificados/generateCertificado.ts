import * as fs from 'fs';
// PASO 1: Importa los tipos PDFPage y RGB junto con los demás
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
// Para los TIPOS que solo existen en tiempo de compilación
import type { PDFFont, PDFPage, RGB } from 'pdf-lib';

// --- Función de ayuda para dibujar PÁRRAFOS con Tipado Correcto de TypeScript ---
function drawParagraph(
  page: PDFPage, // <-- Tipo explícito para la página
  text: string,  // <-- Tipo explícito para el texto
  options: {
    font: PDFFont;
    size: number;
    x: number;
    y: number;
    maxWidth: number;
    lineHeight: number;
    color?: RGB; // <-- Tipo explícito para el color (viene de la función rgb())
  }
) {
  const words = text.split(' ');
  let line = '';
  // Desestructuramos las opciones aquí para que sea más limpio
  const { font, size, x, y: startY, maxWidth, lineHeight, color } = options;
  let currentY = startY;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const testWidth = font.widthOfTextAtSize(testLine, size);
    if (testWidth > maxWidth && n > 0) {
      page.drawText(line, { x, y: currentY, font, size, color });
      line = words[n] + ' ';
      currentY -= lineHeight; // Mover a la siguiente línea
    } else {
      line = testLine;
    }
  }
  // Dibuja la última línea que quedó en el buffer
  page.drawText(line, { x, y: currentY, font, size, color });
}


// La función generarCertificadoPDF sigue exactamente igual que antes...
export async function generarCertificadoPDF({
  nombreUsuario,
  evento,
  fecha,
  calificacion,
}: {
  nombreUsuario: string;
  evento: string;
  fecha: string;
  calificacion?: string;
}) {
  const pdfDoc = await PDFDocument.create();
  // Usamos A4 en vertical para este diseño: 595.28 x 841.89 puntos
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const margin = 50;

  // --- Carga de Assets ---
  const logoUtaBytes = fs.readFileSync('./logo-uta.png');
  const logoSecundarioBytes = fs.readFileSync('./assets/logo-secundario.png');
  const fontBoldBytes = fs.readFileSync('./assets/fonts/Times-Roman-Bold.ttf');
  const fontRegularBytes = fs.readFileSync('./assets/fonts/Helvetica.ttf');
  
  // --- Incrustar Assets ---
  const logoUtaImage = await pdfDoc.embedPng(logoUtaBytes);
  const logoSecundarioImage = await pdfDoc.embedPng(logoSecundarioBytes);
  const titleFont = await pdfDoc.embedFont(fontBoldBytes);
  const bodyFont = await pdfDoc.embedFont(fontRegularBytes);
  
  const colors = {
    text: rgb(0.1, 0.1, 0.1),
    primary: rgb(0.56, 0.09, 0.13), // Un color vino, similar al del logo de la UTA
  };

  // --- 1. Encabezado ---
  logoUtaImage.scale(0.5); // Ajustar escala si es necesario
  page.drawImage(logoUtaImage, {
    x: margin,
    y: height - margin - 70,
    width: logoUtaImage.width * 0.5,
    height: logoUtaImage.height * 0.5,
  });

  logoSecundarioImage.scale(0.8);
  page.drawImage(logoSecundarioImage, {
    x: width - margin - (logoSecundarioImage.width * 0.8),
    y: height - margin - 50,
    width: logoSecundarioImage.width * 0.8,
    height: logoSecundarioImage.height * 0.8,
  });

  page.drawText('UNIVERSIDAD TÉCNICA DE AMBATO', {
    x: width / 2 - titleFont.widthOfTextAtSize('UNIVERSIDAD TÉCNICA DE AMBATO', 18) / 2,
    y: height - margin - 25,
    font: titleFont,
    size: 18,
    color: colors.text,
  });

  page.drawText('FACULTAD DE JURISPRUDENCIA Y CIENCIAS SOCIALES', {
    x: width / 2 - bodyFont.widthOfTextAtSize('FACULTAD DE JURISPRUDENCIA Y CIENCIAS SOCIALES', 12) / 2,
    y: height - margin - 45,
    font: bodyFont,
    size: 12,
  });

  page.drawText('CARRERA DE DERECHO', {
    x: width / 2 - bodyFont.widthOfTextAtSize('CARRERA DE DERECHO', 12) / 2,
    y: height - margin - 60,
    font: bodyFont,
    size: 12,
  });

  // --- 2. Título y Nombre ---
  page.drawText('CONFIEREN EL PRESENTE CERTIFICADO A:', {
    x: width / 2 - bodyFont.widthOfTextAtSize('CONFIEREN EL PRESENTE CERTIFICADO A:', 14) / 2,
    y: height - 200,
    font: bodyFont,
    size: 14,
  });

  const participantName = nombreUsuario.toUpperCase();
  page.drawText(participantName, {
    x: width / 2 - titleFont.widthOfTextAtSize(participantName, 26) / 2,
    y: height - 260,
    font: titleFont,
    size: 26,
    color: colors.primary,
  });

  // Línea horizontal debajo del nombre
  const lineY = height - 280;
  page.drawLine({
    start: { x: margin + 50, y: lineY },
    end: { x: width - margin - 50, y: lineY },
    thickness: 1.5,
    color: colors.primary,
  });


  // --- 3. Párrafo Descriptivo ---
  const bodyText = `Por haber asistido y aprobado el ${evento.toUpperCase()}, realizado el 01 y 02 de febrero de 2017, con una duración de 40 horas. (10 HORAS PRESENCIALES Y 30 AUTÓNOMAS)`;
  drawParagraph(page, bodyText, {
    x: margin + 20,
    y: height - 340,
    maxWidth: width - (margin * 2) - 40,
    lineHeight: 20,
    font: bodyFont,
    size: 13,
  });


  // --- 4. Fecha ---
  const dateText = `Ambato, ${fecha}`;
  const dateTextWidth = bodyFont.widthOfTextAtSize(dateText, 12);
  page.drawText(dateText, {
    x: width - margin - dateTextWidth, // Alineado a la derecha
    y: height - 450,
    font: bodyFont,
    size: 12,
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}