import { defineConfig } from 'auth-astro';
import Credentials from '@auth/core/providers/credentials';
import prisma from './src/db';
import type { AdapterUser } from '@auth/core/adapters';
import bcrypt from 'bcryptjs';

interface CustomUser {
    id: string;
    email: string;
    rol: string;
    ci_pas: string
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
                    where: { cor_cue: credentials.email }
                });

                if (!user || typeof user.cont_cuenta !== 'string') {
                    console.log('Usuario no encontrado o contraseña inválida.');
                    return null;
                }

                // 👇 Aquí comparas la contraseña enviada con la almacenada
                const isValid = await bcrypt.compare(credentials.password, user.cont_cuenta);
                if (!isValid) {
                    console.log('Contraseña incorrecta');
                    return null;
                }

                // 👇 Devolver usuario válido
                return {
                    id: user.id_cue,
                    email: user.cor_cue,
                    rol: user.rol_cue,
                    ci_pas: user.enl_ced_cue,
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

            // Si el login es con credenciales y todo es correcto:
            if (account.provider === "credentials") {
            return '/';  // 👈 Esto forzará la redirección a /
            }

            return true;
        },

        async jwt({ token, user, account }) {
            if (user && account?.provider === 'credentials') {
                token.user = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    rol: (user as any).rol, // usando `as any` para evitar el error
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
                    ...(token.user as any),  // ← evitamos error por propiedades extra
                    rol: token.rol as string,
                    id: token.userId as string,
                } as any;  // ← evita error por propiedades adicionales
            }
            return session;
        }
    }
});