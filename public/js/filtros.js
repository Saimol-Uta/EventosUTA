// ✅ Elimina un filtro de la URL
function quitarFiltro(tipo) {
  const url = new URL(window.location.href);
  url.searchParams.delete(tipo);
  window.location.href = url.toString();
}

// ✅ Búsqueda en vivo: oculta las cards que no coincidan
function activarFiltroEnVivo() {
  const input = document.querySelector(".input-busqueda");
  const cards = document.querySelectorAll(".card");

  if (!input || !cards.length) return;

  input.addEventListener("input", () => {
    const texto = input.value.toLowerCase();
    cards.forEach((card) => {
      const titulo = card.getAttribute("data-titulo")?.toLowerCase() || "";
      card.style.display = titulo.includes(texto) ? "block" : "none";
    });
  });
}

// ✅ Inicializar todo cuando cargue el DOM
document.addEventListener("DOMContentLoaded", () => {
  activarFiltroEnVivo();

  const btnBuscar = document.querySelector(".btn-buscar");
  const inputBuscar = document.querySelector(".input-busqueda");

  // (opcional) Si quieres hacer búsqueda por URL
  btnBuscar?.addEventListener("click", () => {
    const texto = inputBuscar.value.trim();
    const url = new URL(window.location.href);
    if (texto) {
      url.searchParams.set("buscar", texto);
    } else {
      url.searchParams.delete("buscar");
    }
    window.location.href = url.toString();
  });

  inputBuscar?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      btnBuscar.click();
    }
  });
});
