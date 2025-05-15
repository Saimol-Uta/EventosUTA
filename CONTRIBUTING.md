# 🛠️ Guía de Contribución

¡Gracias por tu interés en contribuir a nuestro proyecto de **Sitio Web de Gestión de Eventos académicos en la Facultad de Ingeniería en Sistemas, Electrónica e Industrial**! 🎉 Tu contribución es muy valiosa para nosotros.

Para mantener un flujo de trabajo limpio y ordenado, establecimos las siguientes normas:

## 📂 Estructura de Ramas (GitFlow)
Nuestro flujo de trabajo se basa en **GitFlow**, lo que nos permite organizar el desarrollo y facilitar las contribuciones. Para mayor información sobre nuestra forma de trabajar consulta el archivo **README.md**.

## ✅ Reglas generales
Para que tu cambio tenga una mayor probabilidad de ser aceptado, por favor sigue estas reglas:

 - **Mensajes de commit claros:** Escribe mensajes descriptivos y concisos que expliquen el propósito de los cambios.

   - *Ejemplo:* `Se ha agregado la funcionalidad para mostrar noticias en la página de inicio`.

 - **Nombres de ramas precisos:** Utiliza nombres cortos y significativos para las ramas siguiendo el flujo **GitFlow**. Por ejemplo: `feature/header`, `feature/noticias`

 - **Pruebas locales:** Antes de finalizar tu trabajo, asegúrate de que todo funcione correctamente ejecutando el proyecto localmente con:

    ```bash
    npm run dev
    ```


 - **Pruebas en el navegador:** Toda nueva funcionalidad debe ser probada en el navegador para garantizar su correcta visualización y funcionamiento.

## 🛠️ Proceso de Contribución mediante Pull Requests

### 🔄 Flujo de Trabajo para Contribuidores Externos

1. **Preparación Inicial**
   - Haz un **fork** del repositorio principal en GitHub
   - Clona tu fork localmente:
      ```bash
      git clone https://github.com/Saimol-Uta/EventosUTA.git
      ```
   - Configura el upstream:
      ```bash
      git remote add upstream https://github.com/Saimol-Uta/EventosUTA.git
      ```

2. **Desarrollo de Features**
   - Sincroniza con la rama principal:
      ```bash
      git fetch upstream
      git checkout develop
      git merge upstream/develop
      ```
   - Crea una rama descriptiva:
      ```bash
      git checkout -b feature/nombre-del-feature
      ```
   - Realiza tus cambios siguiendo las recomendaciones presentes en este documento y en README.md

3. **Preparación del PR**
   - Haz commit de tus cambios con mensajes significativos:
     ```bash
     git commit -m "Se ha agregado la funcionalidad X"
     ```
   - Haz push a tu fork:
     ```bash
     git push origin feature/nombre-del-feature
     ```

4. **Creación del Pull Request**
   - Crea un **PR desde tu rama** `feature/*` hacia `develop` del repositorio principal
   - Usa la plantilla de PR y completa todos los campos requeridos
   - Incluye en la descripción:
     - Objetivo del cambio
     - Cambios técnicos realizados
     - Capturas de pantalla (si aplica)

5. **Revisión y Aprobación**
   - Mantén tu rama actualizada con `develop` durante la revisión
   - Resuelve los comentarios de revisión realizando nuevos commits si es necesario
   - Cuando sea aprobado:
     - Espera el merge por uno de los encargados del proyecto

### ⚠️ Notas Importantes
- Los PRs sin descripción adecuada serán rechazados inmediatamente
- Se requiere aprobación de al menos 2 encargados para realizar el merge

---

Siguiendo estas pautas, garantizamos que nuestro proyecto se mantenga bien organizado y exitoso para todos los colaboradores. 🎓📓๋࣭ ⭑

¡Gracias por ser parte de este proyecto! Tu contribución es fundamental para hacer crecer nuestra plataforma. 🙌
