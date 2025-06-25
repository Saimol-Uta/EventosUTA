import { defineConfig } from 'auth-astro';
import Credentials from '@auth/core/providers/credentials';
import { CredentialsSignin } from '@auth/core/errors';
import prisma from './src/db';
import type { AdapterUser } from '@auth/core/adapters';
import bcrypt from 'bcryptjs';

export interface CustomUser {
    id: string;
    email: string;
    rol: string;
    ci_pas: string;
    name: string;
}

export default defineConfig({
    secret: process.env.AUTH_SECRET,
    trustHost: true,
    providers: [
        Credentials({
            credentials: {
                email: { label: 'Correo', type: 'email' },
                password: { label: 'Contraseña', type: 'password' },
            },
            authorize: async (credentials) => {
                if (!credentials?.email || typeof credentials.password !== 'string') {
                    throw new CredentialsSignin("Faltan credenciales.");
                }

                console.log('[authorize] Buscando usuario con email:', credentials.email);

                const user = await prisma.usuarios.findFirst({
                    where: { cor_cue: credentials.email },
                });

                console.log('[authorize] Usuario encontrado:', user ? 'SÍ' : 'NO');
                if (user) {
                    console.log('[authorize] Datos del usuario:', {
                        cor_cue: user.cor_cue,
                        rol_cue: user.rol_cue,
                        tieneContrasena: !!user.cont_cuenta
                    });
                }

                if (!user || typeof user.cont_cuenta !== 'string') {
                    throw new CredentialsSignin("Usuario o Contraseña no son correctos.");
                }

                const isValid = await bcrypt.compare(credentials.password, user.cont_cuenta);

                // Fallback para contraseñas en texto plano (temporal durante migración)
                const isPlainTextValid = !isValid && credentials.password === user.cont_cuenta;

                if (!isValid && !isPlainTextValid) {
                    throw new CredentialsSignin("Contraseña incorrecta.");
                }

                if (!user.verificado) {
                    console.log(`[authorize] Intento de login de usuario no verificado: ${user.cor_cue}`);
                    // Lanzamos el error con un "código" personalizado que podemos leer en el frontend.
                    // Auth.js convertirá esto en: ?error=CredentialsSignin&code=unverified-account
                    const error = new CredentialsSignin("unverified-account");
                    // @ts-ignore - Añadimos una propiedad personalizada para identificarlo
                    error.code = "unverified-account";
                    throw error;
                }

                // Si la contraseña era texto plano y es válida, hashearla para futuras autenticaciones
                if (isPlainTextValid) {
                    console.log('[authorize] Actualizando contraseña de texto plano a hash...');
                    const hashedPassword = await bcrypt.hash(credentials.password, 10);
                    await prisma.usuarios.update({
                        where: { cor_cue: user.cor_cue },
                        data: { cont_cuenta: hashedPassword }
                    });
                }

                //Devolver usuario válido
                return {
                    id: user.cor_cue,
                    email: user.cor_cue,
                    rol: user.rol_cue,
                    ci_pas: user.ced_usu || '',
                    name: `${user.nom_usu1} ${user.nom_usu2 ?? ''} ${user.ape_usu1} ${user.ape_usu2 ?? ''}`.trim(),
                };

            }
        }),
    ],
    session: {
        strategy: "jwt", // <- Esto es lo que faltaba
    },
    pages: {
        signIn: '/login',
        signOut: "/",
        error: '/login',
    },
    cookies: {
        sessionToken: {
            // USA EL NOMBRE EXACTO QUE VISTE EN TU NAVEGADOR
            // Ejemplo, si viste 'authjs.session-token':

            // Si viste '__Secure-authjs.session-token', usa ese.
            // Es crucial que este nombre coincida.
            options: {
                httpOnly: true,
                sameSite: 'lax', // 'lax' es un buen default, 'none' requiere Secure=true
                path: '/',     // Usualmente es '/'
                // 'secure' debe ser true en producción (HTTPS)
                // import.meta.env.PROD es una forma común de manejarlo en Astro/Vite

                secure: true,
                domain: "eventouta.sjproyects.tech",
            }
        },
        csrfToken: {
            name: `__Host-authjs.csrf-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: true,
                domain: "eventouta.sjproyects.tech"
            }
        }
    },

    callbacks: {


        jwt: ({ token, user }) => {

            if (user) {

                token.user = user;
            }


            return token;

        },

        session: ({ session, token }) => {
            session.user = token?.user as AdapterUser;
            return session;
        },
    },
});