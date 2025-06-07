import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generarCertificadoPDF({ nombreUsuario, evento, fecha, calificacion }: {
  nombreUsuario: string;
  evento: string;
  fecha: string;
  calificacion?: string;
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawText('CERTIFICADO DE PARTICIPACIÓN', {
    x: 50, y: 350, size: 24, font, color: rgb(0, 0, 0.8),
  });

  page.drawText(`Se certifica que ${nombreUsuario}`, {
    x: 50, y: 300, size: 16, font,
  });

  page.drawText(`ha participado en el evento: "${evento}"`, {
    x: 50, y: 270, size: 16, font,
  });

  page.drawText(`Fecha: ${fecha}`, {
    x: 50, y: 240, size: 14, font,
  });

  if (calificacion) {
    page.drawText(`Calificación/Asistencia: ${calificacion}`, {
      x: 50, y: 210, size: 14, font,
    });
  }

  page.drawText('Gracias por su participación.', {
    x: 50, y: 170, size: 14, font,
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}