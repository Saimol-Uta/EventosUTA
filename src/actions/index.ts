import { getEventoBySlug, getEventos } from './Eventos';
import { SignIn } from './auth/registerUser.action';
import { getEventosPorUsuario } from './Eventos/getEventosPorUsuario'
import { createCambio } from './Cambios';
import { getUseById } from './auth';
import { getUserByCedula } from './Users/getUserByCedula.action';
import { setUser } from './Users/setUsers.action';
import { getCuentaById, uploadDocumentImage, uploadImageUser } from './Users';
import { getParticipantesPorEvento } from './Reportes/getParticipantesPorEvento';
export const server = {
    getEventos,
    getEventoBySlug,
    SignIn,
    getEventosPorUsuario,
    createCambio,
    getUseById,
    getUserByCedula,
    setUser,
    uploadImageUser,
    getCuentaById,
    uploadDocumentImage,
    getParticipantesPorEvento
};