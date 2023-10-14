export enum Restrictions {
    CASCADE = "CASCADE",
    SET_NULL = "SET NULL",
    NO_ACTION = "NO ACTION",
    RESTRICT = "RESTRICT"
}

export enum EModules {
    purchases = 9,
    sells,
    accounting
}

export enum EPermissions {
    read = 1,
    write,
    update,
    totalControl
}

export enum ETaxTypes {
    iva_0 = 3,
    iva_10_5,
    iva_21,
    iva_27,
    iva_5 = 8,
    iva_2_5,
    no_grabado,
    op_exentas,
    percepciones_iva,
    percepciones_nacionales,
    percepciones_iibb,
    percepciones_municipales,
    impuestos_internos,
}