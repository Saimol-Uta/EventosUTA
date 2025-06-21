import { crearEvento, eliminarEvento, getCategoriaById, getCategorias, getEventoBySlug, getEventos, getOrganizadorByEvento, getOrganizadores, modificarEvento, getCarreras } from './Eventos';

// Importaciones de Facultades
import { getAllFacultades, getFacultadById } from './Facultades/get-facultades.action';

// Importaciones de Asignaciones
import {
    getAllAsignaciones,
    crearAsignacionCompleta,
    modificarAsignacionCompleta,
    eliminarAsignacionCompleta,
    getAsignacionById
} from './Asignaciones/crud-asignaciones';
import {
    getAsignacionesByEvento,
    crearAsignacion,
    eliminarAsignacion,
    modificarAsignacion
} from './Asignaciones/evento-asignaciones';
import {
    getAsignacionesPlantilla,
    vincularAsignacionAEvento,
    duplicarAsignacionesAEvento as duplicarAsignacionAEvento,
    crearAsignacionesPrueba,
    desvincularAsignacionDeEvento
} from './Asignaciones/plantillas-asignaciones';

import { SignIn } from './auth/registerUser.action';
import { getEventosPorUsuario } from './Eventos/getEventosPorUsuario'
import { createCambio } from './Cambios';
import { getUseById } from './auth';
import { getUserByCedula } from './Users/getUserByCedula.action';
import { eliminarUsuario } from './Users/eliminar-usuario.action';
import { modificarUsuario } from './Users/modificar-usuario.action';
import { setUser } from './Users/setUsers.action';
import { getAllUsers } from './Admin/get-all-user.action';
import { getUsersWithAccounts } from './Users/get-users-with-accounts.action';

import { getDatosInscripcion } from './Eventos';
import { setDatosInscripcion } from './Eventos/setDatosInscripcion';
import { getCuentaById, getCuentaByIdSingle, uploadDocumentImage, uploadImageUser } from './Users';
import { crearCuenta } from './Users/crear-cuenta.action';
import { modificarCuenta } from './Users/modificar-cuenta.action';
import { eliminarCuenta } from './Users/eliminar-cuenta.action';
import { uploadComprobante } from './Eventos/uploadComprobantePago.action';
import { GenerarCertificado, generarCertificadoPublico, recuperarCertificadoDesdeUrl } from './Certificados/certificado.action';
import { GenerarOrdenDePago } from './OrdenPago/generarOrden.action';

import { getEventosProximos } from "../actions/Eventos/getEventosProximos";
import { getCertificadosPorUsuario } from "../actions/Eventos/getCertificados";
import { guardarFavoritos } from "../actions/Eventos/guardarFavoritos";

import { getOrganizadoresCR } from './Admin/getOrganizadores.action';
import { eliminarOrganizador } from './Admin/eliminarOrganizador.action';
import { setOrganizadores } from './Admin/setOrganizadores.action';
import { updateOrganizadores } from './Admin/updateOrganizadores.action';

import { crearCarrera, modificarCarrera, eliminarCarrera, getAllCarreras, getCarreraById } from './Carreras';
import { crearCategoria, modificarCategoria, eliminarCategoria, getAllCategorias } from './Categorias';
import { getByIdInscripcion, getEventosINS, updateParticipante, updateEstadoInscripcion } from './Inscripcion';

import { getInfo, getInscripcionesPendientes, updatePaginaPrincipal } from './Admin';

export const server = {
    getEventos,
    guardarFavoritos,
    getEventoBySlug,
    SignIn,
    getEventosPorUsuario,
    createCambio,
    getUseById,
    getUserByCedula,
    setUser, getAllUsers,
    getUsersWithAccounts,
    eliminarUsuario,
    modificarUsuario,
    uploadImageUser, getCuentaById,
    uploadDocumentImage,
    crearCuenta,
    modificarCuenta,
    eliminarCuenta,
    


    getDatosInscripcion,
    setDatosInscripcion,
    uploadComprobante,
    GenerarCertificado,
    generarCertificadoPublico,
    recuperarCertificadoDesdeUrl,
    GenerarOrdenDePago,

    getCertificadosPorUsuario,
    getEventosProximos,
    getInscripcionesPendientes,

    getOrganizadoresCR,
    eliminarOrganizador,
    setOrganizadores,
    updateOrganizadores,

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

    crearAsignacionesPrueba,    // Nuevas acciones para CRUD de carreras
    crearCarrera,
    modificarCarrera,
    eliminarCarrera,
    getAllCarreras,
    getCarreraById,

    // Nuevas acciones para CRUD de categorías
    crearCategoria,
    modificarCategoria,
    eliminarCategoria,
    getAllCategorias,

    // Nuevas acciones para Inscripciones
    getEventosINS,
    getByIdInscripcion,
    updateParticipante,
    updateEstadoInscripcion,

    //description
    updatePaginaPrincipal,
    getInfo,
    getCuentaByIdSingle,

    // Nuevas acciones para Facultades
    getAllFacultades,
    getFacultadById,

};

