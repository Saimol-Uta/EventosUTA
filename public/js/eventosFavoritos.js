
  let currentSlide = 0;

  function cambiarSlide(direccion) {
    const carouselInner = document.getElementById("carousel-inner");
    if (!carouselInner || carouselInner.children.length === 0) return;

    const slides = carouselInner.children;
    const totalSlides = slides.length;

    currentSlide += direccion;
    if (currentSlide < 0) currentSlide = totalSlides - 1;
    if (currentSlide >= totalSlides) currentSlide = 0;

    const slideWidth = slides[0].offsetWidth;
    const offset = currentSlide * slideWidth;
    carouselInner.style.transform = `translateX(-${offset}px)`;

    actualizarIndicadores();
  }

  function actualizarIndicadores() {
    const indicators = document.querySelectorAll("[data-indicator-index]");
    indicators.forEach((el, index) => {
      el.classList.toggle("bg-red-600", index === currentSlide);
      el.classList.toggle("bg-gray-400", index !== currentSlide);
    });
  }

  window.addEventListener("resize", () => {
    const carouselInner = document.getElementById("carousel-inner");
    if (!carouselInner || carouselInner.children.length === 0) return;

    const slideWidth = carouselInner.children[0].offsetWidth;
    carouselInner.style.transform = `translateX(-${currentSlide * slideWidth}px)`;
  });

  window.addEventListener("DOMContentLoaded", () => {
    actualizarIndicadores();

    const carouselInner = document.getElementById("carousel-inner");
    if (carouselInner && carouselInner.children.length > 0) {
      const slideWidth = carouselInner.children[0].offsetWidth;
      carouselInner.style.transform = `translateX(-${currentSlide * slideWidth}px)`;
    }
  });