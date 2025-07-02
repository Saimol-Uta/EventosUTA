import { crearEvento, eliminarEvento, getCategoriaById, getCategorias, getEventoBySlug, getEventos, getOrganizadorByEvento, getOrganizadores, modificarEvento, getCarreras } from './Eventos';
import { finalizarEvento } from './Eventos/finalizar-evento.action';
import { actualizarPagoInscripcion } from './Eventos/actualizarPagoInscripcion.action';

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
import { getInscripcionesByUser } from './Users/get-inscripciones-by-user.action';
import { getCambiosByUser } from './Users/get-cambios-by-user.action';
import { getPerfilCompleto } from './Users/get-perfil-completo.action';
import { actualizarUsuario } from './Users/actualizar-usuario.action';
import { crearUsuario } from './Users/crear-usuario.action';

import { getDatosInscripcion, getDetallesEventoCompleto } from './Eventos';
import { setDatosInscripcion } from './Eventos/setDatosInscripcion';
import { getCuentaById, getCuentaByIdSingle, uploadDocumentImage, uploadImageUser, uploadDocumentPdf, getDashboardData } from './Users';
import { modificarCuenta } from './Users/modificar-cuenta.action';
import { uploadComprobante } from './Eventos/uploadComprobantePago.action';
import { GenerarCertificado, generarCertificadoPublico, recuperarCertificadoDesdeUrl } from './Certificados/certificado.action';
import { GenerarOrdenDePago } from './OrdenPago/generarOrden.action';

import { getEventosProximos } from "../actions/Eventos/getEventosProximos";
import { getCertificadosPorUsuario } from "../actions/Eventos/getCertificados";
import { getEventosFiltrados } from '../actions/Eventos/getFiltros';
import { getFiltrosDinamicos } from '../actions/Eventos/getFiltrosDinamicos';

import { getOrganizadoresCR } from './Admin/getOrganizadores.action';
import { eliminarOrganizador } from './Admin/eliminarOrganizador.action';
import { setOrganizadores } from './Admin/setOrganizadores.action';
import { updateOrganizadores } from './Admin/updateOrganizadores.action';

import { crearCarrera, modificarCarrera, eliminarCarrera, getAllCarreras, getCarreraById } from './Carreras';
import { crearCategoria, modificarCategoria, eliminarCategoria, getAllCategorias } from './Categorias';
import { getByIdInscripcion, getEventosINS, updateParticipante, updateEstadoInscripcion } from './Inscripcion';

import { getInfo, getInscripcionesPendientes, updatePaginaPrincipal } from './Admin';
import { CreateUpdatePaginaFacultad, DeletePaginaFacultad, GetPaginaFacultad, getFacultadById as getFacultadByIdPersonalizacion } from './PerzonalizarPagina';

export const server = {
    getEventos,

    getEventoBySlug,
    SignIn,
    getEventosPorUsuario,
    createCambio,
    getUseById, getUserByCedula,
    setUser, getAllUsers,
    getUsersWithAccounts,
    getInscripcionesByUser,
    getCambiosByUser,
    getPerfilCompleto,
    actualizarUsuario,
    crearUsuario,
    eliminarUsuario,
    modificarUsuario,
    uploadImageUser, getCuentaById,
    uploadDocumentImage,
    uploadDocumentPdf,
    modificarCuenta,



    getDatosInscripcion,
    setDatosInscripcion,
    actualizarPagoInscripcion,
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
    getCategorias, crearEvento,
    modificarEvento,
    eliminarEvento,
    finalizarEvento,// Nuevas acciones para asignaciones
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
    crearCarrera, modificarCarrera,
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
    getDashboardData,
    getEventosFiltrados,
    getFiltrosDinamicos,
    getDetallesEventoCompleto,


    // Nuevas acciones para Pagina Facultad
    getAllFacultades,
    getFacultadById,
    getFacultadByIdPersonalizacion,

    CreateUpdatePaginaFacultad,
    DeletePaginaFacultad,
    GetPaginaFacultad
};

