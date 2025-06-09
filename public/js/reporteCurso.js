import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btn-descargar-reporte');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const doc = new jsPDF();

    doc.text("Reporte de Curso - Participantes", 14, 15);

    autoTable(doc, {
      html: '#tablaCurso',
      startY: 20,
      headStyles: {
        fillColor: [176, 16, 37]
      },
      styles: {
        fontSize: 10,
      }
    });

    doc.save("reporte_curso.pdf");
  });
});