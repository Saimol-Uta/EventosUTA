import cron from 'node-cron';

const cleanupApiUrl = 'http://localhost:4321/api/cleanup-users';
console.log('🕒 Cron Runner iniciado. Esperando el horario programado...');

cron.schedule('*/15 * * * *', async () => {
    const now = new Date().toLocaleString('es-EC');
    console.log(`\n[${now}] - Ejecutando tarea de limpieza programada...`);
    
    try {
        const response = await fetch(cleanupApiUrl);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error en la API');
        console.log(`✅ Resultado: ${data.message}`);
    } catch (error: any) {
        console.error('❌ Error al ejecutar la tarea de limpieza:', error.message);
    }
});
