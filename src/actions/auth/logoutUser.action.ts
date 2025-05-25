import { defineAction } from 'astro:actions';

export const logout = defineAction({
  handler: async (_input, { cookies }) => {
    // Elimina la cookie que mantiene la sesión, ajusta el nombre según corresponda
    cookies.delete('auth-session', { path: '/' });
    
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/login',
      },
    });
  },
});