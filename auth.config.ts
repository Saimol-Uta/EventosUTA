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
                    console.log('Contraseña incorrecta');
                    return null;
                }

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
    // Páginas de inicio de sesión y error
    pages: {
        signIn: '/login',
        error: '/login',
    },

    callbacks: {
        async signIn({ user, account }) {
            if (!user || !account) return false;

            if (account.provider === 'credentials') {
                const rol = (user as any).rol;
                const id = user.id;

                // Redirigir con el id del usuario en la query
                if (rol === 'USUARIO' || rol === 'ESTUDIANTE') {
                    return `/homeUser`;
                }

                if (rol === 'ADMINISTRADOR' || rol === 'MASTER') {
                    return `/homeAdmin`;
                }

                // Por defecto, a home genérico
                return '/';
            }

            return true;
        },

        async jwt({ token, user, account }) {
            if (user && account?.provider === 'credentials') {
                token.user = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    rol: (user as any).rol,
                };
                token.userId = user.id;
                token.rol = (user as any).rol;
            }
            return token;
        },
        async session({ session, token }) {
            if (token?.user) {
                session.user = {
                    ...session.user,
                    ...(token.user as any),
                    rol: token.rol as string,
                    id: token.userId as string,
                } as any;
            }
            return session;
        }
    }
});