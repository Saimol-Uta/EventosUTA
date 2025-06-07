import * as fs from 'fs';
import * as path from 'path'; // Importamos el módulo 'path' de Node.js para manejar rutas de forma segura

// Importaciones de tipos y valores de pdf-lib
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
  
  // --- CAMBIO 1: TAMAÑO DE LA PÁGINA ---
  // Hacemos que la página del PDF tenga las mismas dimensiones que tu imagen.
  const page = pdfDoc.addPage([1920, 1080]);
  const { width, height } = page.getSize();
  const margin = 120; // Aumentamos el margen para el nuevo tamaño

  // --- Carga de Assets ---
  // --- CAMBIO 2: RUTA DE LA IMAGEN ---
  // Usamos path.join para crear una ruta absoluta y segura a tu archivo en la carpeta 'public'.
  const plantillaPath = path.join(process.cwd(), 'public/img/Texto.png');
  const plantillaBytes = fs.readFileSync(plantillaPath);
  const plantillaImage = await pdfDoc.embedPng(plantillaBytes);

  // Usamos fuentes estándar para evitar errores de archivos no encontrados
  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  const colors = {
    text: rgb(0.15, 0.15, 0.15),
    primary: rgb(0.56, 0.09, 0.13),
  };

  // 1. Dibuja tu plantilla como fondo
  page.drawImage(plantillaImage, {
    x: 0,
    y: 0,
    width: width,
    height: height,
  });

  // --- 2. Dibuja el texto dinámico con coordenadas ajustadas para 1920x1080 ---
  // --- CAMBIO 3: COORDENADAS VERTICALES ---
  let currentY = 580; // Nueva posición inicial para el texto

  // NOMBRE DEL PARTICIPANTE (Centrado)
  const nombreUsuarioText = nombreUsuario.toUpperCase();
  const nombreUsuarioWidth = titleFont.widthOfTextAtSize(nombreUsuarioText, 42); // Tamaño de fuente más grande
  page.drawText(nombreUsuarioText, {
    x: (width - nombreUsuarioWidth) / 2,
    y: currentY,
    font: titleFont,
    size: 42,
    color: colors.text,
  });
  currentY -= 70; // Mayor espaciado

  // "Por haber participado..." (Centrado)
  const textoParticipado = 'Por haber participado y aprobado el curso de:';
  const textoParticipadoWidth = bodyFont.widthOfTextAtSize(textoParticipado, 20);
  page.drawText(textoParticipado, {
    x: (width - textoParticipadoWidth) / 2,
    y: currentY,
    font: bodyFont,
    size: 20,
    color: colors.text,
  });
  currentY -= 50;

  // NOMBRE DEL CURSO/EVENTO (Centrado)
  const nombreCursoText = nombreCurso.toUpperCase();
  const nombreCursoWidth = titleFont.widthOfTextAtSize(nombreCursoText, 26);
  page.drawText(nombreCursoText, {
    x: (width - nombreCursoWidth) / 2,
    y: currentY,
    font: titleFont,
    size: 26,
    color: colors.primary,
  });
  currentY -= 50;

  // FECHAS Y DURACIÓN (Centrado)
  const combinedText = `del ${fechaInicio} al ${fechaFin}, con una duración de ${duracionHoras} horas académicas.`;
  const combinedTextWidth = bodyFont.widthOfTextAtSize(combinedText, 18);
  page.drawText(combinedText, {
    x: (width - combinedTextWidth) / 2,
    y: currentY,
    font: bodyFont,
    size: 18,
    color: colors.text,
  });
  currentY -= 110; // Mayor espaciado

  // FECHA DE GENERACIÓN (Alineada a la derecha)
  const generationDateText = `Ambato, ${fechaGeneracion}`;
  const dateTextWidth = bodyFont.widthOfTextAtSize(generationDateText, 18);
  page.drawText(generationDateText, {
    x: width - margin - dateTextWidth,
    y: currentY,
    font: bodyFont,
    size: 18,
    color: colors.text,
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}