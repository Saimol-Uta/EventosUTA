/*import dns from "dns/promises";*/
import fetch from 'node-fetch';

// Función para validar la existencia del Dominio
const domainCache: Record<string, boolean> = {};

export async function validateEmail(email: string): Promise<boolean> {
    const sid = process.env.VERIFALIA_SID;
    const token = process.env.VERIFALIA_AUTH_TOKEN;

    try {
        // Enviar la solicitud inicial para validar el correo
        const response = await fetch('https://api.verifalia.com/v2.3/email-validations', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                entries: [{ inputData: email }],
            }),
        });

        const data = await response.json() as {
            overview: {
                id: string;
                status: string;
            };
        };

        const validationId = data.overview?.id;
        if (!validationId) {
            throw new Error('No se pudo obtener el ID de la validación.');
        }

        // Polling para verificar el estado de la validación
        let status = data.overview.status;
        while (status === 'InProgress') {
            console.log(`Esperando que la validación termine para ${email}...`);
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Esperar 5 segundos

            const checkResponse = await fetch(`https://api.verifalia.com/v2.3/email-validations/${validationId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
                },
            });

            const checkData = await checkResponse.json() as {
                overview: {
                    status: string;
                };
                entries?: {
                    data: {
                        classification?: string;
                    }[];
                };
            };

            console.log('Respuesta completa de seguimiento de Verifalia:', JSON.stringify(checkData, null, 2));

            status = checkData.overview.status;
            if (status === 'Completed') {
                const result = checkData.entries?.data[0]?.classification;
                if (result === 'Deliverable') {
                    console.log(`El correo ${email} es válido.`);
                    return true;
                } else if (result) {
                    console.log(`El correo ${email} no es válido: ${result}`);
                    return false;
                } else {
                    console.error(`No se pudo obtener la clasificación para el correo ${email}.`);
                    return false;
                }
            }
        }

        console.error(`La validación del correo ${email} no pudo completarse.`);
        return false;
    } catch (error) {
        console.error('Error al validar el correo con Verifalia:', error);
        return false;
    }
}