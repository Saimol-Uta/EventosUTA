import { defineConfig } from 'auth-astro';
import Credentials from '@auth/core/providers/credentials';
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
    providers: [
        Credentials({
            credentials: {
                email: { label: 'Correo', type: 'email' },
                password: { label: 'Contraseña', type: 'password' },
            },
            authorize: async (credentials) => {
            try {
                if (!credentials?.email || typeof credentials.password !== 'string') {
                    console.log('Faltan credenciales o formato inválido.');
                    return null;
                }

                const user = await prisma.cuentas.findFirst({
                    where: { cor_cue: credentials.email },
                      include: {
                        usuarios: true, // incluir relación con la tabla usuarios
                    },
                });

                if (!user || typeof user.cont_cuenta !== 'string') {
                    console.log('Usuario no encontrado o contraseña inválida.');
                    return null;
                }

                const isValid = await bcrypt.compare(credentials.password, user.cont_cuenta);
                if (!isValid) {
                    console.log('[authorize] Contraseña incorrecta');
                    return null;
                }
                console.log('[authorize] Usuario autorizado:', user);

                //Devolver usuario válido
                return {
                    id: user.id_cue,
                    email: user.cor_cue,
                    rol: user.rol_cue,
                    ci_pas: user.enl_ced_cue,
                    name: `${user.usuarios.nom_usu1} ${user.usuarios.nom_usu2 ?? ''} ${user.usuarios.ape_usu1} ${user.usuarios.ape_usu2 ?? ''}`.trim(),
                };

            } catch (error) {
                console.error('Error en autorización:', error);
                return null;
            }
        }
        }),
    ],
        pages: {
        signIn: '/login',
        error: '/login',
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

            console.log('[session] Sesión actualizada:', session);
            return session;
        },
    },
});