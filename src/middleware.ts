import { defineMiddleware } from 'astro:middleware';
import { getSession } from "auth-astro/server";

// Definir tipo de usuario basado en lo que tu auth devuelve


const studentRoutes = ['/homeUser'];
const userRoutes = ['/homeUser'];
const adminRoutes = ['/homeAdmin'];
const masterRoutes = ['/homeAdmin'];
const noAuthRoutes = ['/login', '/register'];
const publicRoutes = ['/', '/img/usuario.png', '/default-avatar.png', '/favicon.ico'];


export const onRequest = defineMiddleware(async ({ url, request, locals, redirect }, next) => {

  if (url.pathname.startsWith('/api/auth/')) {
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

  locals.isAdmin = user?.rol === 'ADMINISTRADOR';
  locals.isStudent = user?.rol === 'ESTUDIANTE';
  locals.isUser = user?.rol === 'USUARIO';
  locals.isMaster = user?.rol === 'MASTER';

  const allPrivateRoutes = [...adminRoutes, ...studentRoutes, ...userRoutes, ...masterRoutes];

  // Redirigir usuarios no autenticados que intentan rutas privadas a login
  if (!isLoggedIn && allPrivateRoutes.includes(url.pathname)) {
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
  if (locals.isAdmin && !adminRoutes.includes(url.pathname) && !publicRoutes.includes(url.pathname)) {
    return redirect('/homeAdmin');
  }

  if (locals.isStudent && !studentRoutes.includes(url.pathname) && !publicRoutes.includes(url.pathname)) {
    return redirect('/homeUser');
  }

  if (locals.isUser && !userRoutes.includes(url.pathname) && !publicRoutes.includes(url.pathname)) {
    return redirect('/homeUser');
  }

  if (locals.isMaster && !masterRoutes.includes(url.pathname) && !publicRoutes.includes(url.pathname)) {
    return redirect('/homeAdmin');
  }

  // Evitar que usuarios autenticados entren a login o register
  if (isLoggedIn && noAuthRoutes.includes(url.pathname)) {
    return redirect('/');
  }

  return next();
});