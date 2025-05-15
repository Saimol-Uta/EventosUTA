document.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector(".input-busqueda");
  const cards = document.querySelectorAll(".card");

  input?.addEventListener("input", () => {
    const texto = input.value.toLowerCase();
    cards.forEach((card) => {
      const titulo = card.getAttribute("data-titulo")?.toLowerCase() || "";
      card.style.display = titulo.includes(texto) ? "block" : "none";
    });
  });
});
