interface User {
    id: string;
    email: string;
    rol: string;
    name?: string;
    ci_pas?: string;
};

// Extender Window para propiedades globales
declare global {
    interface Window {
        eventosDestacados: Set<number>;
        guardarFavoritos: () => Promise<void>;
        actualizarBotonGuardar: () => void;
    }
}

// Extender App.Locals para que TypeScript no marque errores
declare namespace App {
    interface Locals {
        isLoggedIn: boolean;
        user: User | null;
        isAdmin: boolean;
        isStudent: boolean;
        isUser: boolean;
        isMaster: boolean;
    }
}