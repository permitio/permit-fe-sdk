import { generateStateKey, getPermissionFromBE, getBulkPermissionFromBE } from './main';
import { actionResource, PermitStateSchema, PermitCheck, CaslPermissionInstance } from './schema';



const permitLocalState: PermitStateSchema = {};
export let permitState: PermitCheck;
export let permitCaslState: CaslPermissionInstance[] = [];

let isInitilized = false;

export const PermitInit = (actor: string, checkUrl: string, defaultAnswerIfNotExist: boolean = false) => {
    
    if (!actor) {
        throw new Error('actor is required');
    }
    if (!checkUrl || typeof checkUrl !== 'string') {
        throw new Error('checkUrl is required, put your backend check url here');
    }


    const loadLocalState = async (actionsResourcesList: actionResource[]) => {
        if (!isInitilized){
            isInitilized = true;
            for (const actionResource of actionsResourcesList) {
                const key = generateStateKey(actionResource.action, actionResource.resource);
                permitLocalState[key] = await getPermissionFromBE(checkUrl, actor, actionResource.action, actionResource.resource, defaultAnswerIfNotExist);
                permitCaslState.push({action: actionResource.action, subject: actionResource.resource, inverted: !permitLocalState[key]});
            }
        }
    }

    const loadLocalStateBulk = async (actionsResourcesList: actionResource[]) => {
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
        permitCaslState.push({action: action, subject: resource, inverted: !permitLocalState[key]});
    }


    permitState = {
        addKeyToState: addKeyToState,
        loadLocalState: loadLocalState,
        loadLocalStateBulk: loadLocalStateBulk,
        actor,
        checkUrl,
        defaultAnswerIfNotExist,
        state: permitLocalState,
        check: check,
        getCaslJson: getCaslJson,
    };
    return permitState;
}


