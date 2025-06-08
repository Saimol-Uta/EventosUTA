import type { APIRoute } from 'astro';
import { guardarContenido } from '@/actions/Admin/update-info.action';

export const post: APIRoute = async ({ request }) => {
  const actionResponse = await guardarContenido({ request });


  const result = 'success' in actionResponse ? actionResponse : { success: false, error: 'Error desconocido' };

  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 400,
    headers: { 'Content-Type': 'application/json' },
  });
};
