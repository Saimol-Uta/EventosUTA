import { getEventoBySlug, getEventos } from './Eventos';
import { SignIn } from './auth/registerUser.action';
import { getEventosPorUsuario } from './Eventos/getEventosPorUsuario'
import { createCambio } from './Cambios';
import { getUseById } from './auth';
import { getUserByCedula } from './Users/getUserByCedula.action';
import { setUser } from './Users/setUsers.action';
import { getEventosProximos } from "../actions/Eventos/getEventosProximos";
import { getCertificadosPorUsuario } from "../actions/Eventos/getCertificados";
import { getCuentaById, uploadDocumentImage, uploadImageUser } from './Users';
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
    getCertificadosPorUsuario,
    getEventosProximos
};