import axios from 'axios';
import { ActionResourceSchema } from './types';

export const getBulkPermissionFromBE = async (url: string, user: string, actionsResourcesList: ActionResourceSchema[]): Promise<boolean[]> => {
  const payload = actionsResourcesList.map((actionResource) => ({
    action: actionResource.action,
    resource: actionResource.resource,
    userAttributes: actionResource.userAttributes || {},
    resourceAttributes: actionResource.resourceAttributes || {},
  }));
  return await axios.post(`${url}?user=${user}`, { resourcesAndActions: payload }).then((response) => {
    return response.data;
  });
};

export const getPermissionFromBE = async (url: string, user: string, action: string, resource: string, defaultPermission: boolean): Promise<boolean> => {
  return await axios
    .get(`${url}?user=${user}&action=${action}&resource=${resource}`)
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

export const generateStateKey = (action: string, resource: string, userAttributes: Record<string, any> = {}, resourceAttributes: Record<string, any> = {}) => {
  const sortedResourceAttributes = Object.keys(resourceAttributes)
    .sort()
    .reduce((obj, key) => {
      obj[key] = resourceAttributes[key];
      return obj;
    }, {} as Record<string, any>);

  const sortedUserAttributes = Object.keys(userAttributes)
  .sort()
  .reduce((obj, key) => {
    obj[key] = userAttributes[key];
    return obj;
  }, {} as Record<string, any>);
    
  const userAttributeKey = userAttributes && Object.keys(userAttributes).length > 0 ? `;userAttributes:${JSON.stringify(sortedUserAttributes)}` : '';
  const resourceAttributeKey = resourceAttributes && Object.keys(resourceAttributes).length > 0 ? `;resourceAttributes:${JSON.stringify(sortedResourceAttributes)}` : '';

  return `action:${action};resource:${resource}${userAttributeKey}${resourceAttributeKey}`;
};
