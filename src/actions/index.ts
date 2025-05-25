import { getEventos } from './Eventos/getEventos';
import { SignIn } from './auth/registerUser.action';
import { logout } from './auth/logoutUser.action';
import { getEventosPorUsuario } from './Eventos/getEventosPorUsuario'
export const server = {
    getEventos,
    SignIn,
    logout,
    getEventosPorUsuario
};