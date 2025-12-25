import axios, { AxiosRequestConfig, AxiosRequestHeaders } from 'axios';

// Interfaces

export interface PermitCheckSchema {
  loggedInUser: string;
  userAttributes: Record<string, any>;
  backendUrl: string;
  defaultAnswerIfNotExist: boolean;
  state: PermitStateSchema;
  check: (action: string, resource: string | ReBACResourceSchema, userAttributes: Record<string, any>, resourceAttributes?: Record<string, any>) => boolean;
  addKeyToState: (
    action: string,
    resource: string | ReBACResourceSchema,
    userAttributes: Record<string, any>,
    resourceAttributes?: Record<string, any>,
  ) => Promise<void>;
  loadLocalState: (actionsResourcesList: ActionResourceSchema[]) => Promise<void>;
  getCaslJson: () => CaslPermissionSchema[];
  loadLocalStateBulk: (actionsResourcesList: ActionResourceSchema[]) => Promise<void>;
  reset: () => void;
}

export interface CaslPermissionSchema {
  action: string;
  subject: string;
  inverted: boolean;
}

export interface PermitStateSchema {
  [key: string]: boolean;
}

export interface ActionResourceSchema {
  action: string;
  resource: string | ReBACResourceSchema;
  userAttributes?: Record<string, any>;
  resourceAttributes?: Record<string, any>;
}

export interface ReBACResourceSchema {
  type: string;
  key: string;
}

// Permit State
let permitLocalState: PermitStateSchema = {};
export let permitState: PermitCheckSchema;
export let permitCaslState: CaslPermissionSchema[] = [];
let isInitialized = false;

export type PermitProps = {
  /** The unique identifier of the logged-in user for permission checks */
  loggedInUser: string;
  /** Optional attributes associated with the user for ABAC policies */
  userAttributes?: Record<string, any>;
  /** The URL of your backend permission check endpoint */
  backendUrl: string;
  /** Default permission value when a check is not found in local state (default: false) */
  defaultAnswerIfNotExist?: boolean;
  /**
   * Custom headers to include in permission check requests.
   * @deprecated This option will be replaced by `axiosConfig.headers` in the next major version.
   * For now, headers must still be provided via `customRequestHeaders`; `axiosConfig.headers` is
   * currently ignored.
   */
  customRequestHeaders?: AxiosRequestHeaders;
  /**
   * Axios request configuration for advanced use cases like CORS credentials or timeouts.
   * Note: any `axiosConfig.headers` you pass here will be overridden by `customRequestHeaders`
   * (and the internal `headers` argument). For now, configure headers via `customRequestHeaders`;
   * in the next major version, headers will instead be read from `axiosConfig.headers`.
   */
  axiosConfig?: AxiosRequestConfig;
};

const getBulkPermissionFromBE = async (
  url: string,
  user: string,
  actionsResourcesList: ActionResourceSchema[],
  headers?: AxiosRequestHeaders,
  axiosConfig?: AxiosRequestConfig,
): Promise<boolean[]> => {
  const payload = actionsResourcesList.map(({ action, resource, userAttributes = {}, resourceAttributes = {} }) => ({
    action,
    resource: typeof resource === 'string' ? resource : `${resource.type}:${resource.key}`,
    userAttributes,
    resourceAttributes,
  }));
  // Exclude headers from axiosConfig for past compatibility.
  const { headers: _, ...restAxiosConfig } = axiosConfig ?? {};
  const config: AxiosRequestConfig = {
    ...restAxiosConfig,
    headers: headers ?? {},
  };

  const response = await axios.post(`${url}?user=${user}`, { resourcesAndActions: payload }, config);
  return response.data.permittedList;
};

const getPermissionFromBE = async (
  url: string,
  user: string,
  action: string,
  resource: string,
  defaultPermission: boolean,
  headers?: AxiosRequestHeaders,
  axiosConfig?: AxiosRequestConfig,
): Promise<boolean> => {
  // Exclude headers from axiosConfig for past compatibility.
  const { headers: _, ...restAxiosConfig } = axiosConfig ?? {};
  const config: AxiosRequestConfig = {
    ...restAxiosConfig,
    headers: headers ?? {},
  };
  return await axios
    .get(`${url}?user=${user}&action=${action}&resource=${resource}`, config)
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

const generateStateKey = (action: string, resource: string | ReBACResourceSchema, resourceAttributes: Record<string, any> = {}): string => {
  const sortedResourceAttributeKeys = Object.keys(resourceAttributes).sort();

  const sortedResourceAttributes = sortedResourceAttributeKeys.reduce((obj, key) => {
    obj[key] = resourceAttributes[key];
    return obj;
  }, {} as Record<string, any>);

  const hasResourceAttributes = sortedResourceAttributeKeys.length > 0;

  const userAttributeKey = `;userAttributes:${JSON.stringify(permitState.userAttributes)}`;
  const resourceAttributeKey = hasResourceAttributes ? `;resourceAttributes:${JSON.stringify(sortedResourceAttributes)}` : '';

  const resourceKey = typeof resource === 'string' ? resource : `${resource.type}:${resource.key}`;

  return `user:${userAttributeKey};action:${action};resource:${resourceKey}${resourceAttributeKey}`;
};

/**
 * Initialize the Permit SDK for frontend permission checks.
 *
 * @param props - Configuration options for the Permit SDK
 * @param props.loggedInUser - The unique identifier of the logged-in user
 * @param props.userAttributes - Optional attributes associated with the user for ABAC policies
 * @param props.backendUrl - The URL of your backend permission check endpoint
 * @param props.defaultAnswerIfNotExist - Default permission value when not found in state (default: false)
 * @param props.customRequestHeaders - Custom headers for requests (deprecated: use axiosConfig.headers in next version)
 * @param props.axiosConfig - Axios config for CORS credentials, timeouts, etc. (headers currently ignored)
 * @returns The Permit state object with permission check methods.
 *
 * @example
 * ```typescript
 * const permit = Permit({
 *   loggedInUser: 'user-123',
 *   backendUrl: '/api/permit-check',
 *   axiosConfig: { withCredentials: true, timeout: 10000 },
 * });
 *
 * await permit.loadLocalStateBulk([
 *   { action: 'read', resource: 'document' },
 *   { action: 'write', resource: 'document' },
 * ]);
 *
 * if (permit.check('read', 'document')) {
 *   // User has permission
 * }
 * ```
 */
export const Permit = ({ loggedInUser, userAttributes = {}, backendUrl, defaultAnswerIfNotExist = false, customRequestHeaders, axiosConfig }: PermitProps) => {
  if (!loggedInUser) {
    throw new Error('loggedInUser is required');
  }
  if (!backendUrl || typeof backendUrl !== 'string') {
    throw new Error('backendUrl is required, put your backend check url here');
  }

  const updatePermissionState = async (actionResource: ActionResourceSchema, permission: boolean) => {
    const { action, resource, resourceAttributes = {} } = actionResource;
    const key = generateStateKey(action, resource, resourceAttributes);
    permitLocalState[key] = permission;
    permitCaslState.push({
      action,
      subject: typeof resource === 'string' ? resource : `${resource.type}:${resource.key}`,
      inverted: !permission,
    });
  };

  const loadLocalState = async (actionsResourcesList: ActionResourceSchema[]) => {
    if (isInitialized) return;
    isInitialized = true;
    for (const actionResource of actionsResourcesList) {
      const resourceKey =
        typeof actionResource.resource === 'string' ? actionResource.resource : `${actionResource.resource.type}:${actionResource.resource.key}`;
      const permission = await getPermissionFromBE(
        backendUrl,
        loggedInUser,
        actionResource.action,
        resourceKey,
        defaultAnswerIfNotExist,
        customRequestHeaders,
        axiosConfig,
      );
      await updatePermissionState(actionResource, permission);
    }
  };

  const loadLocalStateBulk = async (actionsResourcesList: ActionResourceSchema[]) => {
    if (isInitialized) return;
    isInitialized = true;
    const permittedList = await getBulkPermissionFromBE(backendUrl, loggedInUser, actionsResourcesList, customRequestHeaders, axiosConfig);
    for (const [i, actionResource] of actionsResourcesList.entries()) {
      await updatePermissionState(actionResource, permittedList[i]);
    }
  };

  const getCaslJson = () => {
    return permitCaslState;
  };

  const check = (action: string, resource: string | ReBACResourceSchema, resourceAttributes: Record<string, any> = {}): boolean => {
    const key = generateStateKey(action, resource, resourceAttributes);
    return permitLocalState[key] ?? defaultAnswerIfNotExist;
  };

  const addKeyToState = async (action: string, resource: string | ReBACResourceSchema, resourceAttributes: Record<string, any> = {}) => {
    const resourceKey = typeof resource === 'string' ? resource : `${resource.type}:${resource.key}`;
    const permission = await getPermissionFromBE(backendUrl, loggedInUser, action, resourceKey, defaultAnswerIfNotExist, customRequestHeaders, axiosConfig);
    await updatePermissionState({ action, resource, userAttributes: permitState.userAttributes, resourceAttributes }, permission);
  };

  const reset = () => {
    permitLocalState = {};
    permitCaslState = [];
    isInitialized = false;
  };

  permitState = {
    addKeyToState,
    loadLocalState,
    loadLocalStateBulk,
    loggedInUser,
    backendUrl,
    defaultAnswerIfNotExist,
    state: permitLocalState,
    userAttributes,
    check,
    getCaslJson,
    reset,
  };

  return permitState;
};
