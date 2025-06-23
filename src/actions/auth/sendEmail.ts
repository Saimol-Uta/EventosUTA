import { defineAction } from 'astro:actions';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

// Variables de entorno (asegúrate de que estén configuradas en tu .env)
const CLIENT_ID = process.env.AUTH_GOOGLE_ID;
const CLIENT_SECRET = process.env.AUTH_GOOGLE_SECRET;
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const EMAIL_USER = process.env.EMAIL_USER;
const WEBSITE_URL = process.env.WEBSITE_URL || 'http://localhost:4321'; // URL de tu sitio

// Crear un cliente OAuth2
const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

// Establecer las credenciales del cliente OAuth2
oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN
});

// Función para obtener el access_token
async function getAccessToken() {
    try {
        const { token } = await oauth2Client.getAccessToken();
        return token;
    } catch (error) {
        console.error('Error al obtener el token de acceso:', error);
        throw new Error('No se pudo obtener el token de acceso para enviar el correo.');
    }
}

// Crear un transporter de Nodemailer utilizando OAuth 2.0
async function createTransporter() {
    const accessToken = await getAccessToken();
    if (!accessToken) {
        throw new Error("No se pudo obtener el Access Token de Google.");
    }
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: EMAIL_USER,
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            refreshToken: REFRESH_TOKEN,
            accessToken: accessToken
        },
        tls: {
            rejectUnauthorized: true // Es más seguro mantenerlo en true para producción
        }
    });
}

// Acción para enviar el correo de verificación
export async function sendVerificationEmail(email: string, token: string): Promise<void> {
        try {
            const verificationLink = `${WEBSITE_URL}/verificar-cuenta?token=${token}`;
            const transporter = await createTransporter();

            await transporter.sendMail({
                from: `"Talleres Tecnológicos" <${EMAIL_USER}>`,
                to: email,
                subject: 'Verifica tu cuenta en Talleres Tecnológicos',
                text: `¡Gracias por registrarte! Por favor, haz clic en el siguiente enlace para verificar tu cuenta: ${verificationLink}`,
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center; color: #333; padding: 20px;">
                    <h2 style="color: #a00;">¡Bienvenido a Talleres Tecnológicos!</h2>
                    <p>Estamos muy contentos de que te unas a nuestra comunidad.</p>
                    <p>Solo falta un paso más. Por favor, verifica tu dirección de correo electrónico haciendo clic en el botón de abajo.</p>
                    <a href="${verificationLink}" style="background-color: #a00; color: white; padding: 15px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px; font-size: 16px; margin: 20px 0;">
                        Verificar mi Cuenta
                    </a>
                    <p>Este enlace es válido por 15 minutos.</p>
                    <p style="font-size: 12px;">Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:</p>
                    <p style="font-size: 12px;"><a href="${verificationLink}">${verificationLink}</a></p>
                    <hr style="margin-top: 30px;">
                    <p style="font-size: 12px; color: #777;">Si no te registraste en nuestro sitio, por favor ignora este correo.</p>
                </div>
            `,
        });

        console.log(`Correo de verificación enviado a ${email}`);
    } catch (error) {
        console.error('Error al enviar el correo de verificación:', error);
        // Lanzamos el error para que la acción que lo llama pueda manejarlo.
        throw new Error('No se pudo enviar el correo de verificación.');
    }
}