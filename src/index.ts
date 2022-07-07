import axios from 'axios';

export interface PermitCheck {
    check: Function;
    actor: string;
    checkUrl: string;
    defaultAnswerIfNotExist: boolean;
    state: PermitState;
}

export interface PermitState {
    [key: string]: boolean;
}

export interface actionResource {
    action: string;
    resource: string;
}

declare global {
    interface Window { permit: PermitCheck; }
}

export const loadLocalState = async (actorsResourcesList: actionResource[]) => {
    const state: PermitState = {};
    await actorsResourcesList.forEach(async actionResource => {
        await axios.get(`${window.permit.checkUrl}?action=${actionResource.action}&resource=${actionResource.resource}`).then(response => {
            const key = generateStateKey(actionResource.action, actionResource.resource);
            state[key] = response.data;
        }
        ).catch(error => {
            console.log(error);

        });
        return state;

    });
}

export const generateStateKey = (action: string, resource: string) => `action:${action};resource:${resource}`;

export const PermitInit = (actor: string, checkUrl: string, defaultAnswerIfNotExist: boolean = false) => {
    if (!actor) {
        throw new Error('actor is required');
    }
    if (!checkUrl || typeof checkUrl !== 'string') {
        throw new Error('checkUrl is required, put your backend check url here');
    }

    const check = (action: string, resource: string) => {
        const key = generateStateKey(action, resource);
        if (permit.state[key]) {
            return permit.state[key];
        } else {
            return permit.defaultAnswerIfNotExist;
        }
    }

    const state: PermitState = {};

    const permit = {
        actor,
        checkUrl,
        defaultAnswerIfNotExist,
        state: state,
        check: check,
    };
    window.permit = permit;
    return permit;
}


