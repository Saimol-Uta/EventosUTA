import { defineMiddleware } from 'astro:middleware';
import { getSession } from 'auth-astro/server';

// Mantenemos tus rutas definidas
const adminRoutes = ['/homeAdmin', '/admin', '/Eventos', '/Inscripcion/Inscripcion', '/buscarCertificado', '/Formularios/FormularioSolicitudCambioUsuario', '/cursosCompleto', '/CompletarPerfilUser', '/Admin/EventosCRUD', '/Admin/Asignaciones'];
const studentRoutes = ['/homeUser', '/student', '/Eventos', '/Inscripcion/Inscripcion', '/buscarCertificado', '/Formularios/FormularioSolicitudCambioUsuario', '/cursosCompleto', '/CompletarPerfilUser'];
const userRoutes = ['/homeUser', '/user', '/Eventos', '/Inscripcion/Inscripcion', '/buscarCertificado', '/Formularios/FormularioSolicitudCambioUsuario', '/cursosCompleto', '/CompletarPerfilUser'];
const masterRoutes = ['/homeAdmin', '/master', '/Eventos', '/Inscripcion/Inscripcion', '/buscarCertificado', '/Formularios/FormularioSolicitudCambioUsuario', '/cursosCompleto', '/CompletarPerfilUser', '/Admin/EventosCRUD', '/Admin/Asignaciones'];

// Función para verificar si una ruta coincide con los patrones permitidos (simplificada)
function isRouteAllowed(pathname: string, allowedRoutes: string[]): boolean {
    // Esta lógica permite que /admin/* funcione para /admin/loquesea
    return allowedRoutes.some(route => pathname.startsWith(route));
}

export const onRequest = defineMiddleware(async ({ url, request, locals, redirect }, next) => {
    // ¡¡El cambio más importante!! Envolvemos todo en un try...catch
    try {
        // Las rutas de la API de autenticación y las acciones de Astro siempre se permiten
        if (url.pathname.startsWith('/api/auth/') || url.pathname.startsWith('/_actions')) {
            return next();
        }

        // Obtenemos la sesión. Si esto falla, el catch lo atrapará.
        const session = await getSession(request);
        const isLoggedIn = !!session?.user;

        // Rutas que no requieren autenticación
        const publicRoutes = ['/login', '/register', '/'];

        // Si el usuario está logueado y va a /login o /register, lo redirigimos a su home.
        if (isLoggedIn && (url.pathname === '/login' || url.pathname === '/register')) {
            const userRole = (session.user as any)?.rol?.toLowerCase();
            if (userRole === 'administrador' || userRole === 'master') {
                return redirect('/homeAdmin', 307);
            }
            return redirect('/homeUser', 307);
        }

        // Si el usuario NO está logueado y NO está intentando acceder a una ruta pública, lo mandamos a /login.
        if (!isLoggedIn && !publicRoutes.includes(url.pathname)) {
            return redirect('/login', 307);
        }

        // Si el usuario ESTÁ logueado, verificamos si tiene acceso a la ruta que pide.
        if (isLoggedIn) {
            const userRole = (session.user as any)?.rol?.toLowerCase();
            let allowedRoutes: string[] = [];
            if (userRole === 'administrador') allowedRoutes = adminRoutes;
            else if (userRole === 'master') allowedRoutes = masterRoutes;
            else if (userRole === 'estudiante') allowedRoutes = studentRoutes;
            else if (userRole === 'usuario') allowedRoutes = userRoutes;

            // Si la ruta solicitada NO está en las rutas permitidas para su rol...
            if (!isRouteAllowed(url.pathname, allowedRoutes)) {
                // ...lo mandamos a su página de inicio correspondiente.
                if (userRole === 'administrador' || userRole === 'master') {
                    return redirect('/homeAdmin', 307);
                }
                return redirect('/homeUser', 307);
            }
        }

        // Si pasó todos los filtros, dejamos que continúe a la página solicitada.
        return next();

    } catch (e) {
        // ¡¡AQUÍ ESTÁ LA MAGIA!! Si cualquier 'await' de arriba falla, lo capturamos.
        console.error("----------- ERROR EN EL MIDDLEWARE -----------");
        console.error(e);
        console.error("--------------------------------------------");

        // Y en lugar de una respuesta vacía, enviamos un error claro.
        return new Response("Error interno del servidor en el middleware de autenticación.", { status: 500 });
    }
});