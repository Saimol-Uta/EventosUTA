# 🎓 Sitio Web de Gestión de Eventos académicos en la Facultad de Ingeniería en Sistemas, Electrónica e Industrial.

Bienvenido al proyecto de desarrollo de una plataforma diseñada para gestionar eventos academicos en la Facultad de Ingeniería en Sistemas, Electrónica e Industrial de la Universidad Técnica de Ambato.
Desarrollado utilizando el framework **Astro**, siguiendo el flujo de trabajo **GitFlow** y utilizando **Jira Service Management** para la gestión de control de cambios.

## 🌟 Descripción

Plataforma web robusta para la gestión integral de eventos académicos en la Facultad de Ingeniería en Sistemas, Electrónica e Industrial de la Universidad Técnica de Ambato. El sistema optimiza procesos de organización, inscripción y certificación con un enfoque en usabilidad, seguridad y escalabilidad. Las principales funcionalidades incluyen:

 - CRUD completo para eventos, carreras y organizadores.
 - Información detallada de eventos (ubicación, área, fecha de inicio, duración, etc).
 - Sistema de filtrado avanzado para los eventos (nombre, categoría, carrera, duración y tipo de evento).
 - Inscripción a eventos.
 - Implementación de roles y permisos:
   1. 👨‍🎓 Usuario
   - Puede inscribirse a eventos.
   - Modificar sus datos personales y subir documentos.

   2. 👨‍💼 Administrador 
   - Acceso a procesos CRUD.
    - Asignar notas y asistencia.
    - Deshabilitar cuentas (sin eliminarlas).
    - Validar documentos y pagos.

 - Registro e inicio de sesión de usuarios.
 - Generación de certificados.
 - Generación de reportes de asistencia y calificaciones.

El sitio ha sido creado con un enfoque en rendimiento y usabilidad, garantizando una experiencia fluida para los usuarios.

## 🚀 Tecnologías Utilizadas

- [Astro](https://astro.build/): Framework principal para la construcción del sitio web. Permite un desarrollo modular y escalable.
- HTML5: Para la estructura básica y semántica de las páginas.
- CSS3: Estilos fundamentales para la apariencia de la página.
- [TailwindCSS](https://tailwindcss.com/): Framework de CSS para estilos rápidos y eficientes, con implementación sencilla.
- JavaScript: Para funcionalidades dinámicas en el frontend.
- TypeScript: Utilizado tanto en el frontend como en el backend, mejorando la calidad del código con tipado estático.
## 📂 Estructura del Proyecto

- `src/`
  - `pages/`: Páginas principales del sitio.
  - `components/`: Componentes reutilizables (Navbar, Footer, Tarjetas de Noticias).
  - `layouts/`: Diseños base para las páginas.
- `public/`: Recursos públicos (imágenes, íconos, etc.)

## 📄 Pre-requisitos
Para ejecutar el proyecto localmente, asegúrate de tener instalada la versión adecuada de Node.js:
- Node.js v18.17.1, v20.3.0 o v22.0.0 (v19 y v21 no son compatibles).

## 🛠️ Instalación y ejecución
Sigue estos pasos para instalar y ejecutar el proyecto:

1. Clona el repositorio:
   ```bash
   git clone https://github.com/saimol-h1/ProyectoFutBol.git
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Ejecuta el proyecto en modo desarrollo:
   ```bash
   npm run dev
   ```

4. Abre tu navegador en `http://localhost:4321` (el puerto puede variar).

## 🛡️ Flujo de trabajo con GitFlow

Este proyecto sigue el modelo **GitFlow**:
- `main`: Rama principal con el código estable y listo para producción.
- `develop`: Rama para integrar nuevas funcionalidades.
- `feature/*`: Ramas para el desarrollo de nuevas características.
- `release/*`: Ramas para preparar versiones estables de lanzamiento.
- `hotfix/*`: Ramas para la corrección urgente de errores en producción.

## ⌛ Versionado 
Utilizamos el sistema de [Semantic Versioning (SemVer)](http://semver.org/) para el versionado.

## 📜 Contribución

¡Nos encantaría que contribuyeras al proyecto! Si deseas colaborar, por favor consulta el archivo `CONTRIBUTING.md` para conocer los detalles.

## ✍️ Autor

Este proyecto fue desarrollado por el equipo de estudiantes número 3 para la asignatura Manejo y Configuración de Software, en la carrera de Software de la Facultad de Ingeniería en Sistemas, Electrónica e Industrial de Universidad Técnica de Ambato.
El equipo de desarrollo está conformado por:
  - **Saimol Jimenez** - *Backend, Control de Versiones, Gestión del Control de Cambios* - [saimol-h1](https://github.com/saimol-h1)
  - **Manuel Ramírez** - *Frontend, Control de Versiones, Gestión del Control de Cambios* - [InkyWinkR](https://github.com/InkyWinkR)
  - **Brayan Pilla** - *Backend* - [BSPA02](https://github.com/BSPA02)
  - **Marlon Guevara** - *Frontend* - [MarlonKuna26](https://github.com/MarlonKuna26)
  - **Josue Fiallos** - *Backend* - [Josu-F1](https://github.com/Josu-F1)
  - **Carol Cañizares** - *Frontend* - [carol104](https://github.com/carol104)

También puedes mirar la lista de todos los [contribuyentes](https://github.com/Saimol-Uta/EventosUTA/graphs/contributors) que han participado en este proyecto. 

---

¡Gracias por visitar nuestro proyecto! 🎓📓๋࣭ ⭑
