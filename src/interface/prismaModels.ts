export interface Asignaciones {
    id_asi: string;
    nom_asi: string;
    des_asi: string;
    id_eve_per: string;
    eventos: Eventos;
    requisitos: Requisitos[];
}

export interface Carreras {
    id_car: string;
    nom_car: string;
    des_car: string;
    nom_fac_per: string;
    usuarios: Usuarios[];
}

export interface CategoriasEventos {
    id_cat: string;
    nom_cat: string;
    des_cat: string;
    pun_apr_cat?: number;
    asi_cat: number;
    eventos: Eventos[];
}



export interface Eventos {
    id_eve: string;
    nom_eve: string;
    des_eve: string;
    id_cat_eve: string;
    fec_ini_eve: Date;
    fec_fin_eve?: Date;
    hor_ini_eve: Date;
    hor_fin_eve?: Date;
    dur_eve?: number;
    are_eve?: string;
    ubi_eve: string;
    ced_org_eve: string;
    asignaciones: Asignaciones[];
    organizadores: Organizadores;
    categorias_eventos: CategoriasEventos;
    inscripciones: Inscripciones[];
}

export interface Inscripciones {
    id_ins: string;
    fec_ins: Date;
    val_ins: number;
    met_pag_ins?: string;
    enl_ord_pag_ins?: string;
    id_usu_ins: string;
    id_eve_ins: string;
    eventos: Eventos;
    usuarios: Usuarios;
    participaciones: Participaciones[];
}

export interface Organizadores {
    ced_org: string;
    nom_org1: string;
    nom_org2?: string;
    ape_org1: string;
    ape_org2: string;
    tit_aca_org: string;
    eventos: Eventos[];
}

export interface PaginaPrincipal {
    id_pag: number;
    des_pag?: string;
    mis_pag?: string;
    vis_pag?: string;
}

export interface Participaciones {
    id_par: string;
    est_par: string;
    asi_par?: number;
    not_par?: number;
    id_ins_per: string;
    enl_cer_par?: string;
    fec_cer_par?: Date;
    inscripciones: Inscripciones;
}

export interface Requisitos {
    id_req: string;
    nom_req: string;
    des_req: string;
    id_asi_per: string;
    asignaciones: Asignaciones;
}

export interface Usuarios {
    cor_cue: string; // Primary key - correo electrónico
    ced_usu: string;
    nom_usu1: string;
    nom_usu2?: string;
    ape_usu1: string;
    ape_usu2?: string;
    fec_nac_usu: Date;
    num_tel_usu?: string;
    id_car_per?: string;
    rol_cue: string;
    cont_cuenta: string;
    enl_ced_cue?: string;
    enl_mat_cue?: string;
    img_user?: string;
    inscripciones: Inscripciones[];
    carreras?: Carreras;
    cambios: Cambios[];
}

export interface Cambios {
    num_cam: number;
    fec_cam: Date;
    rol_sol_cam?: string;
    des_cam: string;
    mot_cam: string;
    pri_cam?: string;
    tip_cam?: string;
    ori_cam?: string;
    enl_doc_cam?: string;
    est_cam?: string;
    id_cue_sol: string;
    cuentas: Usuarios;
}
