import { spawn } from 'child_process';

console.log('🚀 Iniciando procesos en paralelo...');

/**
 * Ejecuta un comando y muestra su salida en la consola con un prefijo.
 * @param {string} command - El comando completo a ejecutar (ej. "npm run dev:astro").
 * @param {string} prefix - El prefijo para identificar la salida (ej. "ASTRO").
 * @param {string} color - El color para el prefijo.
 */
function runScript(command, prefix, color) {
    // En Windows, los comandos de npm a menudo necesitan ser ejecutados a través del shell 'cmd'.
    const isWindows = process.platform === 'win32';
    const shell = isWindows ? 'cmd' : '/bin/sh';
    const args = isWindows ? ['/c', command] : ['-c', command];

    const child = spawn(shell, args, { stdio: 'pipe' });

    const colorCode = `\x1b[${color}m`;
    const resetCode = '\x1b[0m';

    child.stdout.on('data', (data) => {
        // Imprime cada línea con su prefijo y color correspondiente.
        const lines = data.toString().split('\n').filter(line => line.trim() !== '');
        lines.forEach(line => console.log(`${colorCode}[${prefix}]${resetCode} ${line}`));
    });

    child.stderr.on('data', (data) => {
        const lines = data.toString().split('\n').filter(line => line.trim() !== '');
        // Muestra los errores en color rojo.
        lines.forEach(line => console.error(`\x1b[31m[${prefix}-ERROR] ${line}\x1b[0m`));
    });

    child.on('close', (code) => {
        console.log(`${colorCode}[${prefix}]${resetCode} proceso terminado con código ${code}`);
    });

    return child;
}

// Comandos y colores para cada proceso
runScript('npm run dev:astro', 'ASTRO', '36'); // Cian
runScript('npm run dev:cron', 'CRON ', '33'); // Amarillo