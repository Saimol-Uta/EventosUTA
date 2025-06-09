import { defineMiddleware } from 'astro:middleware';
import { getSession } from "auth-astro/server";

// Rutas específicas por rol
const adminRoutes = [
    // Páginas principales de admin
    '/homeAdmin',

    // CRUD y gestión administrativa
    '/Admin/*',
    '/Admin/EventosCRUD',
    '/Admin/Asignaciones',
    '/Admin/UsuariosCRUD',
    '/Admin/OrganizadoresCRUD',
    '/Admin/gestionEventos',
    '/Admin/CategoriasCRUD',
    '/Admin/CarrerasCRUD',
    '/Admin/AprobacionInscripciones',

    // Gestión de eventos
    '/Eventos/*',

    // Inscripciones y procesos

];

const studentRoutes = [
    // Página principal de estudiante
    '/homeUser',

    // Perfil y configuración del usuario
    '/User/*',
    '/User/CompletarPerfilUser',
    '/User/EventosUser',
    '/User/historial',
    '/User/certificadosUsuario',
    '/PerfilUserDos',

    // Eventos y consultas
    '/Eventos/*',
    '/eventosProximos',
    '/cursosCompleto',
    '/buscarCertificado',

    // Inscripciones (solo visualización)
    '/Inscripcion/Inscripcion',
    '/Inscripcion/ProcesoDePago',

    // Formularios permitidos
    '/Formularios/FormularioSolicitudCambioUsuario'
];

const userRoutes = [
    // Página principal de usuario general
    '/homeUser',

    // Perfil y configuración del usuario
    '/User/*',
    '/User/CompletarPerfilUser',
    '/User/EventosUser',
    '/User/historial',
    '/User/certificadosUsuario',
    '/PerfilUserDos',

    // Eventos y consultas
    '/Eventos/*',
    '/eventosProximos',
    '/cursosCompleto',
    '/buscarCertificado',

    // Inscripciones
    '/Inscripcion/Inscripcion',
    '/Inscripcion/ProcesoDePago',

    // Formularios permitidos
    '/Formularios/FormularioSolicitudCambioUsuario'
];

const masterRoutes = [
    // Acceso completo - combina admin y user
    '/homeAdmin',
    '/homeUser',

    // Todas las rutas administrativas
    '/Admin/*',
    '/Admin/EventosCRUD',
    '/Admin/Asignaciones',
    '/Admin/UsuariosCRUD',
    '/Admin/OrganizadoresCRUD',
    '/Admin/gestionEventos',
    '/Admin/CategoriasCRUD',
    '/Admin/CarrerasCRUD',
    '/Admin/AprobacionInscripciones',

    // Gestión de eventos
    '/Eventos/*',

    // Inscripciones y procesos
    '/Inscripcion/*',
    '/inscripciones/*',
    '/participantes/*',

    // Área de usuario
    '/User/*',
    '/User/CompletarPerfilUser',
    '/User/EventosUser',
    '/User/historial',
    '/User/certificadosUsuario',

    // Formularios y configuraciones
    '/Formularios/*',
    '/Formularios/FormularioSolicitudCambioUsuario',

    // Funcionalidades generales
    '/buscarCertificado',
    '/cursosCompleto',
    '/eventosProximos',
    '/PerfilUserDos'
];


// Rutas que no requieren autenticación
const noAuthRoutes = ['/login', '/register', '/'];

// Rutas públicas accesibles por todos (autenticados y no autenticados)
const publicRoutes = [
    '/Inscripcion/*',
    '/inscripciones/*',
    '/participantes/*',

    // Formularios y configuraciones
    '/Formularios/*',
    '/Formularios/FormularioSolicitudCambioUsuario',

    // Funcionalidades generales
    '/buscarCertificado',
    '/cursosCompleto',
    '/eventosProximos',
    '/PerfilUserDos',
    '/favicon.ico',
    '/favicon.svg',
    '/logo-fisei.png',
    '/logo-uta.png',
    '/PerfilDefault.png',
    '/img/*',
    '/js/*',

    // Páginas públicas específicas
    '/about',
    '/contact',

    // API y acciones que pueden ser públicas
    '/_astro/*',

    // Solo para depuración en desarrollo
    // '/*' - COMENTADO POR SEGURIDAD
];

// Función para verificar si una ruta coincide con los patrones permitidos
function isRouteAllowed(pathname: string, allowedRoutes: string[]): boolean {
    return allowedRoutes.some(route => {
        if (route.endsWith('/*')) {
            // Patrón wildcard: /admin/* permite /admin/cualquier-cosa
            const baseRoute = route.slice(0, -2);
            return pathname.startsWith(baseRoute);
        }
        return pathname === route;
    });
}

export const onRequest = defineMiddleware(async ({ url, request, locals, redirect }, next) => {
    // Permitir rutas de autenticación de Auth.js
    if (url.pathname.startsWith('/api/auth/')) {
        return next();
    }

    // Permitir acciones de Astro
    if (url.pathname.startsWith('/_actions/')) {
        return next();
    }

    // Permitir archivos estáticos de Astro
    if (url.pathname.startsWith('/_astro/')) {
        return next();
    }

    const session = await getSession(request);
    const rawUser = session?.user as (User & { rol?: string }) | undefined;

    // Validar sesión
    if (session && !rawUser?.email) {
        // Sesión mal formada o inválida
        locals.isLoggedIn = false;
        locals.user = null;
    }

    const isLoggedIn = !!rawUser;
    const user = rawUser as App.Locals['user'];

    // Configurar locals
    locals.isLoggedIn = isLoggedIn;
    locals.user = user ?? null;
    locals.isAdmin = user?.rol === 'ADMINISTRADOR' || user?.rol === 'administrador';
    locals.isStudent = user?.rol === 'ESTUDIANTE' || user?.rol === 'estudiante';
    locals.isUser = user?.rol === 'USUARIO' || user?.rol === 'usuario';
    locals.isMaster = user?.rol === 'MASTER' || user?.rol === 'master';

    // Verificar rutas públicas primero
    if (isRouteAllowed(url.pathname, publicRoutes)) {
        return next();
    }

    // Verificar rutas que no requieren autenticación
    if (noAuthRoutes.includes(url.pathname)) {
        // Si está autenticado y trata de ir a login/register, redirigir
        if (isLoggedIn) {
            if (locals.isAdmin || locals.isMaster) {
                return redirect('/homeAdmin');
            }
            if (locals.isStudent || locals.isUser) {
                return redirect('/homeUser');
            }
            return redirect('/');
        }
        return next();
    }

    // Si no está autenticado y trata de acceder a una ruta protegida
    if (!isLoggedIn) {
        return redirect('/login');
    }

    // Redirección para la raíz cuando está autenticado
    if (url.pathname === '/') {
        if (locals.isAdmin || locals.isMaster) {
            return redirect('/homeAdmin');
        }
        if (locals.isStudent || locals.isUser) {
            return redirect('/homeUser');
        }
        return redirect('/homeUser'); // Fallback por defecto
    }

    // Control de acceso basado en roles
    let hasAccess = false;

    if (locals.isAdmin && isRouteAllowed(url.pathname, adminRoutes)) {
        hasAccess = true;
    } else if (locals.isStudent && isRouteAllowed(url.pathname, studentRoutes)) {
        hasAccess = true;
    } else if (locals.isUser && isRouteAllowed(url.pathname, userRoutes)) {
        hasAccess = true;
    } else if (locals.isMaster && isRouteAllowed(url.pathname, masterRoutes)) {
        hasAccess = true;
    }

    // Si no tiene acceso, redirigir a su página de inicio
    if (!hasAccess) {
        if (locals.isAdmin || locals.isMaster) {
            return redirect('/homeAdmin');
        }
        if (locals.isStudent || locals.isUser) {
            return redirect('/homeUser');
        }
        // Fallback para roles no reconocidos
        return redirect('/login');
    }

    return next();
});