import axios from 'axios';
import { ActionResourceSchema } from './types';

export const getBulkPermissionFromBE = async (url: string, user: string, actionsResourcesList: ActionResourceSchema[]): Promise<boolean[]> => {
  const payload = actionsResourcesList.map((actionResource) => ({
    action: actionResource.action,
    resource: actionResource.resource,
    attributes: actionResource.attributes || {},
  }));
  return await axios.post(`${url}?user=${user}`, { resourcesAndActions: payload }).then((response) => {
    return response.data;
  });
};

export const getPermissionFromBE = async (
  url: string,
  user: string,
  action: string,
  resource: string,
  defaultPermission: boolean,
  attributes: Record<string, any> = {},
): Promise<boolean> => {
  const attributeQuery = attributes && Object.keys(attributes).length > 0 ? `&attributes=${JSON.stringify(attributes)}` : '';
  return await axios
    .get(`${url}?user=${user}&action=${action}&resource=${resource}${attributeQuery}`)
    .then((response) => {
      return response.data.permitted;
    })
    .catch((error) => {
      if (error.response.status === 403) {
        return false;
      }
      // tslint:disable-next-line:no-console
      console.error(error);
      return defaultPermission;
    });
};

export const generateStateKey = (action: string, resource: string, attributes: Record<string, any> = {}) => {
  const attributeKey = attributes && Object.keys(attributes).length > 0 ? `;attributes:${JSON.stringify(attributes)}` : '';
  return `action:${action};resource:${resource}${attributeKey}`;
};
