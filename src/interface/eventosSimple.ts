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
    img_eve?: string;
    es_destacado?:boolean;

    // Relaciones
    asignaciones?: any[]; // Puedes reemplazar 'any' por la interfaz correspondiente si la tienes
    organizador?: any;    // Relación con organizadores
    categoria_evento?: any; // Relación con categorias_eventos
    inscripciones?: any[];  // Relación con inscripciones
}