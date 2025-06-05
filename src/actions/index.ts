import { crearEvento, eliminarEvento, getCategoriaById, getCategorias, getEventoBySlug, getEventos, getOrganizadorByEvento, getOrganizadores, modificarEvento, getCarreras, getAsignacionesByEvento, crearAsignacion, eliminarAsignacion, modificarAsignacion, getAllAsignaciones, crearAsignacionCompleta, modificarAsignacionCompleta, eliminarAsignacionCompleta, getAsignacionesPlantilla, duplicarAsignacionAEvento, vincularAsignacionAEvento, crearAsignacionesPrueba } from './Eventos';
import { SignIn } from './auth/registerUser.action';
import { getEventosPorUsuario } from './Eventos/getEventosPorUsuario'
import { createCambio } from './Cambios';
import { getUseById } from './auth';
import { getUserByCedula } from './Users/getUserByCedula.action';
import { setUser } from './Users/setUsers.action';
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