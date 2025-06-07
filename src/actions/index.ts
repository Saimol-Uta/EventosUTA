import { getEventoBySlug, getEventos } from './Eventos';
import { SignIn } from './auth/registerUser.action';
import { getEventosPorUsuario } from './Eventos/getEventosPorUsuario'
import { createCambio } from './Cambios';
import { getUseById } from './auth';
import { getUserByCedula } from './Users/getUserByCedula.action';
import { setUser } from './Users/setUsers.action';
import { getDatosInscripcion } from './Eventos';
import { getCuentaById, uploadDocumentImage, uploadImageUser } from './Users';
import { setDatosInscripcion } from './Eventos/setDatosInscripcion';
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
    getDatosInscripcion,
    setDatosInscripcion,

};