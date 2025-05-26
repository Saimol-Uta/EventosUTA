import { getEventoBySlug, getEventos } from './Eventos';
import { SignIn } from './auth/registerUser.action';
import { getEventosPorUsuario } from './Eventos/getEventosPorUsuario'
export const server = {
    getEventos,
    getEventoBySlug,
    SignIn,
    getEventosPorUsuario
};