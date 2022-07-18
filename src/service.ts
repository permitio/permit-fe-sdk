import axios from 'axios';
import { ActionResourceSchema } from './types';

export const getBulkPermissionFromBE = async (url: string, user: string, actionsResourcesList: ActionResourceSchema[]): Promise<boolean[]> => {
    return await axios.post(`${url}?user=${user}`,actionsResourcesList).then(response => {
        return response.data;
   });
}
export const getPermissionFromBE = async (url: string, user: string, action: string, resource: string, defaultPermission: boolean): Promise<boolean> => {
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

export const generateStateKey = (action: string, resource: string) => `action:${action};resource:${resource}`;
