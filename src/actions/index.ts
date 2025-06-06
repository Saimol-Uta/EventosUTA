import { crearEvento, eliminarEvento, getCategoriaById, getCategorias, getEventoBySlug, getEventos, getOrganizadorByEvento, getOrganizadores, modificarEvento, getCarreras, getAsignacionesByEvento, crearAsignacion, eliminarAsignacion, modificarAsignacion, getAllAsignaciones, crearAsignacionCompleta, modificarAsignacionCompleta, eliminarAsignacionCompleta, getAsignacionesPlantilla, duplicarAsignacionAEvento, vincularAsignacionAEvento, crearAsignacionesPrueba } from './Eventos';
import { SignIn } from './auth/registerUser.action';
import { getEventosPorUsuario } from './Eventos/getEventosPorUsuario'
import { createCambio } from './Cambios';
import { getUseById } from './auth';
import { getUserByCedula } from './Users/getUserByCedula.action';
import { setUser } from './Users/setUsers.action';
import { getEventosProximos } from "../actions/Eventos/getEventosProximos";
import { getCertificadosPorUsuario } from "../actions/Eventos/getCertificados";
import { getCuentaById, uploadDocumentImage, uploadImageUser } from './Users';
import { getInscripcionesPendientes } from './Admin';
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
    getEventosProximos,
    getInscripcionesPendientes

    getOrganizadorByEvento,
    getOrganizadores,
    getCategoriaById,
    getCategorias,
    crearEvento,
    modificarEvento,
    eliminarEvento,    // Nuevas acciones para asignaciones
    getCarreras,
    getAsignacionesByEvento,
    crearAsignacion,
    eliminarAsignacion,
    modificarAsignacion,    // Nuevas acciones para CRUD independiente de asignaciones
    getAllAsignaciones,
    crearAsignacionCompleta,
    modificarAsignacionCompleta,
    eliminarAsignacionCompleta,
    getAsignacionesPlantilla,
    duplicarAsignacionAEvento,
    vincularAsignacionAEvento,
    crearAsignacionesPrueba

};