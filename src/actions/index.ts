import { getEventos } from './Eventos/getEventos';
import { SignIn } from './auth/registerUser.action';
export const server = {
    getEventos,
    SignIn
};