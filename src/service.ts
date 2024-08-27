import axios from 'axios';
import { ActionResourceSchema, ReBACResourceSchema } from './types';
import { permitState } from '.';

export const getBulkPermissionFromBE = async (url: string, user: string, actionsResourcesList: ActionResourceSchema[]): Promise<boolean[]> => {
  const payload = actionsResourcesList.map((actionResource) => ({
    action: actionResource.action,
    resource: typeof actionResource.resource === 'string' ? actionResource.resource : `${actionResource.resource.type}:${actionResource.resource.key}`,
    resourceAttributes: actionResource.resourceAttributes || {},
  }));
  
  return await axios.post(`${url}?user=${user}`, { resourcesAndActions: payload }).then((response) => {
    return response.data;
  });
};

export const getPermissionFromBE = async (url: string, user: string, action: string, resource: string | ReBACResourceSchema, defaultPermission: boolean): Promise<boolean> => {
  const resourceKey = typeof resource === 'string' ? resource : `${resource.type}:${resource.key}`;
  
  return await axios
    .get(`${url}?user=${user}&action=${action}&resource=${resourceKey}`)
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

export const generateStateKey = (action: string, resource: string | ReBACResourceSchema, resourceAttributes: Record<string, any> = {}) => {
  const sortedResourceAttributes = Object.keys(resourceAttributes)
    .sort()
    .reduce((obj, key) => {
      obj[key] = resourceAttributes[key];
      return obj;
    }, {} as Record<string, any>);

  const userAttributeKey = `;userAttributes:${JSON.stringify(permitState.userAttributes)}`;
  const resourceAttributeKey =
    resourceAttributes && Object.keys(resourceAttributes).length > 0 ? `;resourceAttributes:${JSON.stringify(sortedResourceAttributes)}` : '';

  const resourceKey = typeof resource === 'string' ? resource : `${resource.type}:${resource.key}`;

  return `action:${action};resource:${resourceKey}${userAttributeKey}${resourceAttributeKey}`;
};
