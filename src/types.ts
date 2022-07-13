export interface PermitCheck {
    check: Function;
    actor: string;
    checkUrl: string;
    defaultAnswerIfNotExist: boolean;
    state: PermitStateSchema;
    addKeyToState: Function;
    loadLocalState: Function;
    getCaslJson: Function;
    loadLocalStateBulk: Function;
}

export interface CaslPermissionInstance {
    action: string;
    subject: string;
    inverted: boolean; // if true, the permission is denied
}

export interface PermitStateSchema {
    [key: string]: boolean;
}

export interface actionResource {
    action: string;
    resource: string;
}