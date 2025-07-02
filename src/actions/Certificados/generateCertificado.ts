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
  nota, // Nuevo campo
  asistencia, // Nuevo campo
}: {
  nombreUsuario: string;
  nombreCurso: string;
  fechaInicio: string;
  fechaFin: string;
  duracionHoras: string;
  fechaGeneracion: string;
  nota: number; // Nuevo campo
  asistencia: number; // Nuevo campo
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([1920, 1080]);
  const { width, height } = page.getSize();
  const margin = 120;

  // Carga de assets
  const plantillaPath = path.join(process.cwd(), 'public/img/Texto.png');
  const plantillaBytes = fs.readFileSync(plantillaPath);
  const plantillaImage = await pdfDoc.embedPng(plantillaBytes);

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

  let currentY = 650;


  const nombreUsuarioText = nombreUsuario.toUpperCase();
  const nombreUsuarioWidth = nameFont.widthOfTextAtSize(nombreUsuarioText, 52); 
  page.drawText(nombreUsuarioText, {
    x: (width - nombreUsuarioWidth) / 2,
    y: currentY,
    font: nameFont,
    size: 52, 
    color: colors.text,
  });
  currentY -= 70;

  const textoParticipado = 'Por haber participado y aprobado el curso de:';
  const textoParticipadoWidth = bodyFont.widthOfTextAtSize(textoParticipado, 30);
  page.drawText(textoParticipado, {
    x: (width - textoParticipadoWidth) / 2,
    y: currentY,
    font: bodyFont,
    size: 30,
    color: colors.text,
  });
  currentY -= 70;

  const nombreCursoText = nombreCurso.toUpperCase();
  const nombreCursoWidth = titleFont.widthOfTextAtSize(nombreCursoText, 40);
  page.drawText(nombreCursoText, {
    x: (width - nombreCursoWidth) / 2,
    y: currentY,
    font: titleFont,
    size: 40,
    color: colors.primary,
  });
  currentY -= 70;

  const combinedText = `del ${fechaInicio} al ${fechaFin}, con una duración de ${duracionHoras} horas académicas.`;
  const combinedTextWidth = bodyFont.widthOfTextAtSize(combinedText, 30);
  page.drawText(combinedText, {
    x: (width - combinedTextWidth) / 2,
    y: currentY,
    font: bodyFont,
    size: 30, 
    color: colors.text,
  });
  currentY -= 70; 

    const notaAsistenciaText = `Con una calificación de ${nota} y una asistencia del ${asistencia}%.`;
  const notaAsistenciaTextWidth = bodyFont.widthOfTextAtSize(notaAsistenciaText, 30);
  page.drawText(notaAsistenciaText, {
      x: (width - notaAsistenciaTextWidth) / 2,
      y: currentY,
      font: bodyFont,
      size: 30,
      color: colors.text,
  });
  currentY -= 100; 
  const rightMarginForDate = 280;
  const generationDateText = `Ambato, ${fechaGeneracion}`;
  const dateTextWidth = nameFont.widthOfTextAtSize(generationDateText, 28);
  page.drawText(generationDateText, {
    x: width - rightMarginForDate - dateTextWidth,
    y: currentY,
    font: nameFont,
    size: 28, 
    color: colors.text,
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}