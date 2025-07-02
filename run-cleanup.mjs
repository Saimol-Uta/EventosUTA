console.log("Ejecutando script de limpieza...");

try {
    const response = await fetch('http://localhost:4321/api/cleanup-users');
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Error en la respuesta del servidor');
    }

    console.log('Respuesta de la API:', data.message);
} catch (error) {
    console.error('No se pudo ejecutar la tarea de limpieza:', error.message);
    console.error('Asegúrate de que tu proyecto de Astro esté corriendo con `npm run dev`.');
}