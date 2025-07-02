import { defineMiddleware } from 'astro:middleware';
import { getSession } from "auth-astro/server";

// Rutas específicas por rol
const adminRoutes = [
    '/homeAdmin',
    '/Admin/*',
    '/Admin/AprobacionInscripciones',
    '/Admin/Asignaciones',
    '/Admin/AsignacionesNuevo',
    '/Admin/CarrerasCRUD',
    '/Admin/CategoriasCRUD',
    '/Admin/EventosCRUD',
    '/Admin/gestionEventos',
    '/Admin/OrganizadoresCRUD',
    '/Admin/UsuariosCRUD',
    '/Eventos/*',
    '/Inscripcion/Inscripcion',
    '/buscarCertificado',
    '/Formularios/FormularioSolicitudCambioUsuario',
    '/cursosCompleto',
    '/CompletarPerfilUser',
    '/PerfilUserDos',
    '/inscripciones/*',
    '/participantes/*'
];

const studentRoutes = [
    '/homeUser', 
    '/User/certificadosUsuario',
    '/User/CompletarPerfilUser',
    '/User/EventosUser',
    '/User/historial',
    '/User/buscarCertificado',
    '/User/cursosCompleto',
    '/User/eventosProximos',
    '/Eventos/*', 
    '/Inscripcion/Inscripcion',
    '/buscarCertificado',
    '/Formularios/FormularioSolicitudCambioUsuario',
    '/cursosCompleto',
    '/CompletarPerfilUser'
    ,'/PerfilUserDos'
];

const userRoutes = [
    '/homeUser',
    '/User/certificadosUsuario',
    '/User/CompletarPerfilUser',
    '/User/EventosUser',
    '/User/historial',
    '/User/buscarCertificado',
    '/User/cursosCompleto',
    '/User/eventosProximos',
    '/Eventos/*',
    '/Inscripcion/Inscripcion',
    '/buscarCertificado',
    '/Formularios/FormularioSolicitudCambioUsuario',
    '/cursosCompleto',
    '/CompletarPerfilUser'
    ,'/PerfilUserDos'
];

const masterRoutes = [
    '/homeAdmin',
    '/Admin/*',
    '/Admin/AprobacionInscripciones',
    '/Admin/Asignaciones',
    '/Admin/AsignacionesNuevo',
    '/Admin/CarrerasCRUD',
    '/Admin/CategoriasCRUD',
    '/Admin/EventosCRUD',
    '/Admin/gestionEventos',
    '/Admin/OrganizadoresCRUD',
    '/Admin/UsuariosCRUD',
    '/Eventos/*',
    '/Inscripcion/Inscripcion',
    '/buscarCertificado',
    '/Formularios/FormularioSolicitudCambioUsuario',
    '/cursosCompleto',
    '/CompletarPerfilUser',
    '/PerfilUserDos',
    '/inscripciones/*',
    '/participantes/*'
];


// Rutas que no requieren autenticación (login y registro)
const noAuthRoutes = ['/login', '/register', '/'];

// Rutas públicas accesibles por todos (autenticados y no autenticados)
const publicRoutes = [
    '/', // La raíz, manejada explícitamente para redirección de usuarios logueados
    '/login',
    '/register',
    '/img/usuario.png',
    '/default-avatar.png',
    '/favicon.ico',
    '/about',
    '/contact',
    '/cursosCompleto',
    '/Eventos/*',
    '/User/verificar-cuenta'
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

    // Permitir rutas de autenticación
    if (url.pathname.startsWith('/api/auth/')) {
        return next();
    }

    // ✅ AGREGAR ESTA LÍNEA - Permitir acciones de Astro
    if (url.pathname.startsWith('/_actions/')) {
        return next();
    }

    const session = await getSession(request);
    const rawUser = session?.user as (User & { rol?: string }) | undefined;

    if (session && !rawUser?.email) {
        // Sesión mal formada o inválida
        locals.isLoggedIn = false;
        locals.user = null;
    }

    const isLoggedIn = !!rawUser;
    const user = rawUser as App.Locals['user'];

    locals.isLoggedIn = isLoggedIn;
    locals.user = user ?? null;
    locals.isAdmin = user?.rol === 'ADMINISTRADOR' || user?.rol === 'administrador';
    locals.isStudent = user?.rol === 'ESTUDIANTE' || user?.rol === 'estudiante';
    locals.isUser = user?.rol === 'USUARIO' || user?.rol === 'usuario';
    locals.isMaster = user?.rol === 'MASTER' || user?.rol === 'master';

    // Si la ruta es pública, permitir acceso
    if (isRouteAllowed(url.pathname, publicRoutes)) {
        return next();
    }

    const allPrivateRoutes = [...adminRoutes, ...studentRoutes, ...userRoutes, ...masterRoutes];

    // Redirigir usuarios no autenticados que intentan rutas privadas a login
    if (!isLoggedIn && allPrivateRoutes.some(route => isRouteAllowed(url.pathname, [route]))) {
        return redirect('/login');
    }

    // Redirección explícita para la raíz /
    if (url.pathname === '/' && isLoggedIn) {
        if (locals.isAdmin || locals.isMaster) {
            return redirect('/homeAdmin');
        }
        if (locals.isStudent || locals.isUser) {
            return redirect('/homeUser');
        }
    }

    // Control de acceso para rutas privadas según rol
    if (isLoggedIn) {
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

        // Si no tiene acceso a la ruta específica, redirigir a su página de inicio
        if (!hasAccess) {
            if (locals.isAdmin || locals.isMaster) {
                return redirect('/homeAdmin');
            }
            if (locals.isStudent || locals.isUser) {
                return redirect('/homeUser');
            }
        }
    }

    // Evitar que usuarios autenticados entren a login o register
    if (isLoggedIn && noAuthRoutes.includes(url.pathname)) {
        return redirect('/');
    }

    return next();
});