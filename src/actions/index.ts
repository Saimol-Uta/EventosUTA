import { crearEvento, eliminarEvento, getCategoriaById, getCategorias, getEventoBySlug, getEventos, getOrganizadorByEvento, getOrganizadores, modificarEvento, getCarreras, getAsignacionesByEvento, crearAsignacion, eliminarAsignacion, modificarAsignacion, getAllAsignaciones, crearAsignacionCompleta, modificarAsignacionCompleta, eliminarAsignacionCompleta, getAsignacionesPlantilla, duplicarAsignacionAEvento, vincularAsignacionAEvento, crearAsignacionesPrueba } from './Eventos';
import { SignIn } from './auth/registerUser.action';
import { getEventosPorUsuario } from './Eventos/getEventosPorUsuario'
import { createCambio } from './Cambios';
import { getUseById } from './auth';
import { getUserByCedula } from './Users/getUserByCedula.action';
import { setUser } from './Users/setUsers.action';

import { getDatosInscripcion } from './Eventos';
import { getCuentaById, uploadDocumentImage, uploadImageUser } from './Users';
import { setDatosInscripcion } from './Eventos/setDatosInscripcion';
import { uploadComprobante } from './Eventos/uploadComprobantePago.action';

import { getEventosProximos } from "../actions/Eventos/getEventosProximos";
import { getCertificadosPorUsuario } from "../actions/Eventos/getCertificados";


import { crearCarrera, modificarCarrera, eliminarCarrera, getAllCarreras, getCarreraById } from './Carreras';
import { getByIdInscripcion, getEventosINS, updateParticipante, updateEstadoInscripcion } from './Inscripcion';

import { getInscripcionesPendientes } from './Admin';
import { guardarContenido } from './Admin';

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
    uploadComprobante,


    getCertificadosPorUsuario,
    getEventosProximos,
    getInscripcionesPendientes,

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

    crearAsignacionesPrueba,

    // Nuevas acciones para CRUD de carreras
    crearCarrera,
    modificarCarrera,
    eliminarCarrera,
    getAllCarreras,
    getCarreraById,    // Nuevas acciones para Inscripciones
    getEventosINS,
    getByIdInscripcion,
    updateParticipante,
    updateEstadoInscripcion,
    

};

