export interface PermitCheckSchema {
    actor: string;
    checkUrl: string;
    defaultAnswerIfNotExist: boolean;
    state: PermitStateSchema;
    check: (action: string, resource: string)=>boolean;
    addKeyToState: (action: string, resource: string)=>Promise<void>;
    loadLocalState: (actionsResourcesList: ActionResourceSchema[])=>Promise<void>;
    getCaslJson: ()=>CaslPermissionSchema[];
    loadLocalStateBulk: (actionsResourcesList: ActionResourceSchema[])=>Promise<void>;
}

export interface CaslPermissionSchema {
    action: string;
    subject: string;
    inverted: boolean; // if true, the permission is denied
}

export interface PermitStateSchema {
    [key: string]: boolean;
}

export interface ActionResourceSchema {
    action: string;
    resource: string;
}