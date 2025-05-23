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
                    // 1. Validar que las credenciales no estén vacías
                    if (!credentials?.email || typeof credentials.password !== 'string') { // Asegurar que password también es string
                        console.log('Faltan credenciales o el formato es incorrecto.');
                        return null;
                    }

                    const user = await prisma.cuentas.findFirst({
                        where: {
                            cor_cue: credentials.email
                        }
                    });

                    if (!user || typeof user.cont_cuenta !== 'string') {
                        if (!user) {
                            console.log('Usuario no encontrado:', credentials.email);
                        } else {
                            // Esto indica que el usuario existe pero cont_cuenta es null o no es un string.
                            // Para un login con credenciales, esto podría ser un estado anómalo.
                            console.error('El usuario:', credentials.email, 'no tiene un hash de contraseña válido.');
                        }
                        return null;
                    }

                    // Devolver el usuario con la misma estructura que Google
                    return {
                        id: user.id_cue,
                        email: user.cor_cue,
                        rol: user.rol_cue,
                        ci_pas: user.enl_ced_cue
                    } as CustomUser;

                } catch (error) {
                    console.error('Error en autenticación:', error);
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
            try {
                // Solo queda validación para provider de tipo 'credentials'
                if (!account) {
                    return '/';
                }
                return true;
            } catch (error) {
                console.error('Error en signIn:', error);
                return '/';
            }
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