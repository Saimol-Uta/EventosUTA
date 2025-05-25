import { getEventos } from './Eventos/getEventos';
import { SignIn } from './auth/registerUser.action';
import { getEventosPorUsuario } from './Eventos/getEventosPorUsuario'
export const server = {
    getEventos,
    SignIn,
    getEventosPorUsuario
};