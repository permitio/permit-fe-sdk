import axios from 'axios';
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

const getBulkPermissionFromBE = async (url: string, user: string, actionsResourcesList: ActionResourceSchema[]): Promise<boolean[]> => {
    return await axios.post(`${url}?user=${user}`,{resourcesAndActions:actionsResourcesList}).then(response => {
        return response.data.permittedList;
   });
}
const getPermissionFromBE = async (url: string, user: string, action: string, resource: string, defaultPermission: boolean): Promise<boolean> => {
    return await axios.get(`${url}?user=${user}&action=${action}&resource=${resource}`).then(response => {
        return response.data.permitted;
    }
    ).catch(error => {
        if (error.response.status === 403) {
            return false;
        }
        // tslint:disable-next-line:no-console
        console.error(error);
        return defaultPermission;
    });
}

const generateStateKey = (action: string, resource: string) => `action:${action};resource:${resource}`;
const permitLocalState: PermitStateSchema = {};
export let permitState: PermitCheckSchema;
export let permitCaslState: CaslPermissionSchema[] = [];

let isInitilized = false;

export const PermitInit = (actor: string, checkUrl: string, defaultAnswerIfNotExist: boolean = false) => {
    
    if (!actor) {
        throw new Error('actor is required');
    }
    if (!checkUrl || typeof checkUrl !== 'string') {
        throw new Error('checkUrl is required, put your backend check url here');
    }


    const loadLocalState = async (actionsResourcesList: ActionResourceSchema[]) => {
        if (!isInitilized){
            isInitilized = true;
            for (const actionResource of actionsResourcesList) {
                const key = generateStateKey(actionResource.action, actionResource.resource);
                permitLocalState[key] = await getPermissionFromBE(checkUrl, actor, actionResource.action, actionResource.resource, defaultAnswerIfNotExist);
                permitCaslState.push({action: actionResource.action, subject: actionResource.resource, inverted: !permitLocalState[key]});
            }
        }
    }

    const loadLocalStateBulk = async (actionsResourcesList: ActionResourceSchema[]) => {
        if (!isInitilized){
            isInitilized = true;
            const permittedList = await getBulkPermissionFromBE(checkUrl, actor, actionsResourcesList);
            let i = 0;
            for (const actionResource of actionsResourcesList) {
                const key = generateStateKey(actionResource.action, actionResource.resource);
                permitLocalState[key] = permittedList[i];
                i=i+1;
                permitCaslState.push({action: actionResource.action, subject: actionResource.resource, inverted: !permitLocalState[key]});
            }
        }
    }

    const getCaslJson = () => {
        return permitCaslState;
    }

    const check = (action: string, resource: string) => {
        const key = generateStateKey(action, resource);
        if (permitLocalState[key]) {
            return permitLocalState[key];
        } else {
            return defaultAnswerIfNotExist;
        }
    }

    const addKeyToState = async (action: string, resource: string) => {
        const key = generateStateKey(action, resource);
        permitLocalState[key] = await getPermissionFromBE(checkUrl, actor, action, resource, defaultAnswerIfNotExist);
        permitCaslState.push({action, subject: resource, inverted: !permitLocalState[key]});
    }


    permitState = {
        addKeyToState,
        loadLocalState,
        loadLocalStateBulk,
        actor,
        checkUrl,
        defaultAnswerIfNotExist,
        state: permitLocalState,
        check,
        getCaslJson,
    };
    return permitState;
}


