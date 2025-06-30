// ✅ Elimina un filtro de la URL
function quitarFiltro(tipo) {
  const url = new URL(window.location.href);
  url.searchParams.delete(tipo);
  window.location.href = url.toString();
}

// ✅ Búsqueda en vivo con mensaje si no hay resultados
function activarFiltroEnVivo() {
  const input = document.querySelector(".input-busqueda");
  const cards = document.querySelectorAll(".card");
  const mensajeSinResultados = document.querySelector(".sin-resultados");

  if (!input || !cards.length) return;

  input.addEventListener("input", () => {
    const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const texto = normalize(inputBuscar.value.toLowerCase().trim());
    let encontrados = 0;

    cards.forEach((card) => {
      const titulo = normalize(card.getAttribute("data-titulo")?.toLowerCase() || "");
  const coincide = titulo.includes(texto);
  card.style.display = coincide ? "block" : "none";
  if (coincide) encontrados++;
    });

    // ✅ Mostrar u ocultar el mensaje según los resultados
    if (mensajeSinResultados) {
      mensajeSinResultados.style.display = encontrados === 0 ? "block" : "none";
    }
  });
}

// ✅ Inicializar todo cuando cargue el DOM
document.addEventListener("DOMContentLoaded", () => {
  activarFiltroEnVivo();

  const btnBuscar = document.querySelector(".btn-buscar");
  const inputBuscar = document.querySelector(".input-busqueda");
  const cards = document.querySelectorAll(".card");
  const mensajeSinResultados = document.querySelector(".sin-resultados");

  btnBuscar?.addEventListener("click", () => {
    const texto = inputBuscar.value.toLowerCase().trim();
    let encontrados = 0;

    cards.forEach((card) => {
      const titulo = card.getAttribute("data-titulo")?.toLowerCase() || "";
      const coincide = titulo.includes(texto);
      card.style.display = coincide ? "block" : "none";
      if (coincide) encontrados++;
    });

    if (mensajeSinResultados) {
      mensajeSinResultados.style.display = encontrados === 0 ? "block" : "none";
    }

    // También puedes actualizar la URL
    const url = new URL(window.location.href);
    if (texto) {
      url.searchParams.set("buscar", texto);
    } else {
      url.searchParams.delete("buscar");
    }
    window.history.replaceState({}, "", url);
  });

  inputBuscar?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      btnBuscar.click();
    }
  });
});

//Eventos favoritos 
let eventosSeleccionados = new Set();

  function toggleFavorito(boton) {
  const id = boton.dataset.id;

  if (eventosSeleccionados.has(id)) {
    eventosSeleccionados.delete(id);
    boton.classList.remove("activo");
  } else {
    if (eventosSeleccionados.size >= 6) {
      alert("Solo puedes seleccionar exactamente 6 eventos destacados.");
      return;
    }
    eventosSeleccionados.add(id);
    boton.classList.add("activo");
  }

  actualizarBotonGuardar();
}
  function actualizarBotonGuardar() {
    const btn = document.getElementById("btn-guardar-favoritos");
    if (btn) {
      btn.disabled = eventosSeleccionados.size !== 6;
    }
  }
async function guardarFavoritos() {
  if (eventosSeleccionados.size !== 6) {
    alert("Debes seleccionar exactamente 6 eventos.");
    return;
  }

  const res = await fetch("/api/guardarFavoritos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ eventos: Array.from(eventosSeleccionados) })
  });

  const data = await res.json();
  alert(data.message);
}

