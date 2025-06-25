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

                const user = await prisma.usuarios.findFirst({
                    where: { cor_cue: credentials.email },
                });

                if (!user || typeof user.cont_cuenta !== 'string') {
                    throw new CredentialsSignin("Usuario o Contraseña no son correctos.");
                }

                const isValid = await bcrypt.compare(credentials.password, user.cont_cuenta);
                const isPlainTextValid = !isValid && credentials.password === user.cont_cuenta;

                if (!isValid && !isPlainTextValid) {
                    throw new CredentialsSignin("Contraseña incorrecta.");
                }

                if (!user.verificado) {
                    const error = new CredentialsSignin("unverified-account");
                    // @ts-ignore
                    error.code = "unverified-account";
                    throw error;
                }

                if (isPlainTextValid) {
                    const hashedPassword = await bcrypt.hash(credentials.password, 10);
                    await prisma.usuarios.update({
                        where: { cor_cue: user.cor_cue },
                        data: { cont_cuenta: hashedPassword }
                    });
                }

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
    callbacks: {
        jwt: ({ token, user }) => {
            if (user) token.user = user;
            return token;
        },
        session: ({ session, token }) => {
            if (token?.user) {
                session.user = token?.user as AdapterUser;
            }
            return session;
        },
    },
});