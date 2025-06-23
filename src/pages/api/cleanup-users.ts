import type { APIRoute } from 'astro';
import prisma from '../../db';

export const GET: APIRoute = async () => {
    console.log('Iniciando tarea de limpieza de usuarios no verificados...');

    try {
        const now = new Date();

        // Busca todos los usuarios que no estén verificados y cuya fecha de expiración ya pasó.
        const expiredUsers = await prisma.usuarios.findMany({
            where: {
                verificado: false,
                fec_exp_cod: {
                    lt: now, // "lt" significa "less than" (menor que la fecha y hora actual)
                },
            },
        });

        if (expiredUsers.length === 0) {
            console.log('No se encontraron usuarios expirados para eliminar.');
            return new Response(
                JSON.stringify({ message: 'No hay usuarios para limpiar.' }), 
                { status: 200 }
            );
        }

        const userEmails = expiredUsers.map(u => u.cor_cue);
        console.log(`Se eliminarán ${expiredUsers.length} usuarios:`, userEmails);

        // Elimina los usuarios encontrados
        const deleteResult = await prisma.usuarios.deleteMany({
            where: {
                cor_cue: {
                    in: userEmails,
                },
            },
        });

        console.log(`Tarea completada. Se eliminaron ${deleteResult.count} registros.`);

        return new Response(
            JSON.stringify({ 
                message: `Limpieza completada. Se eliminaron ${deleteResult.count} usuarios.` 
            }),
            { status: 200 }
        );

    } catch (error) {
        console.error('Error durante la limpieza de usuarios:', error);
        return new Response(
            JSON.stringify({ message: 'Error interno del servidor durante la limpieza.' }),
            { status: 500 }
        );
    }
}