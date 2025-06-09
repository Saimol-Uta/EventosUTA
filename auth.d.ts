import { DefaultSession, DefaultUser } from '@auth/core/types';

declare module '@auth/core/types' {
    interface User extends DefaultUser {
        role?: string;
        ci_pas?: string;

    }

    interface Session extends DefaultSession {
        user: User;
    }
}