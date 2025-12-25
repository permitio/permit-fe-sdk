import axios, { AxiosRequestConfig, AxiosRequestHeaders } from 'axios';
import { ActionResourceSchema, ReBACResourceSchema } from './types';
import { permitState } from '.';

/**
 * Fetch permissions in bulk from the backend.
 * @deprecated This function will be removed in the next major version.
 * Use the `Permit` factory and its `loadLocalStateBulk` method instead.
 */
export const getBulkPermissionFromBE = async (
  url: string,
  user: string,
  actionsResourcesList: ActionResourceSchema[],
  headers?: AxiosRequestHeaders,
  axiosConfig?: AxiosRequestConfig,
): Promise<boolean[]> => {
  const payload = actionsResourcesList.map((actionResource) => ({
    action: actionResource.action,
    resource: typeof actionResource.resource === 'string' ? actionResource.resource : `${actionResource.resource.type}:${actionResource.resource.key}`,
    resourceAttributes: actionResource.resourceAttributes || {},
  }));

  // Exclude headers from axiosConfig for past compatibility.
  const { headers: _, ...restAxiosConfig } = axiosConfig ?? {};
  const config: AxiosRequestConfig = {
    ...restAxiosConfig,
    headers: headers ?? {},
  };
  return await axios.post(`${url}?user=${user}`, { resourcesAndActions: payload }, config).then((response) => {
    return response.data;
  });
};

/**
 * Fetch a single permission from the backend.
 * @deprecated This function will be removed in the next major version.
 * Use the `Permit` factory and its `loadLocalState` or `addKeyToState` methods instead.
 */
export const getPermissionFromBE = async (
  url: string,
  user: string,
  action: string,
  resource: string | ReBACResourceSchema,
  defaultPermission: boolean,
  headers?: AxiosRequestHeaders,
  axiosConfig?: AxiosRequestConfig,
): Promise<boolean> => {
  const resourceKey = typeof resource === 'string' ? resource : `${resource.type}:${resource.key}`;
  // Exclude headers from axiosConfig for past compatibility.
  const { headers: _, ...restAxiosConfig } = axiosConfig ?? {};
  const config: AxiosRequestConfig = {
    ...restAxiosConfig,
    headers: headers ?? {},
  };

  return await axios
    .get(`${url}?user=${user}&action=${action}&resource=${resourceKey}`, config)
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

/**
 * Generate a unique key for storing permission state.
 * @deprecated This internal utility will be removed in the next major version.
 * Use the `Permit` factory methods which handle state management internally.
 */
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
