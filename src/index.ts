import axios from 'axios';

// Interfaces

export interface PermitCheckSchema {
  loggedInUser: string;
  backendUrl: string;
  defaultAnswerIfNotExist: boolean;
  state: PermitStateSchema;
  check: (action: string, resource: string, userAttributes: Record<string, any>, resourceAttributes?: Record<string, any>) => boolean;
  addKeyToState: (action: string, resource: string, userAttributes: Record<string, any>, resourceAttributes?: Record<string, any>) => Promise<void>;
  loadLocalState: (actionsResourcesList: ActionResourceSchema[]) => Promise<void>;
  getCaslJson: () => CaslPermissionSchema[];
  loadLocalStateBulk: (actionsResourcesList: ActionResourceSchema[]) => Promise<void>;
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
  resource: string;
  userAttributes?: Record<string, any>;
  resourceAttributes?: Record<string, any>;
}

// Permit State
const permitLocalState: PermitStateSchema = {};
export let permitState: PermitCheckSchema;
export let permitCaslState: CaslPermissionSchema[] = [];
let isInitialized = false;

export type PermitProps = {
  loggedInUser: string;
  backendUrl: string;
  defaultAnswerIfNotExist?: boolean;
};


const getBulkPermissionFromBE = async (
  url: string,
  user: string,
  actionsResourcesList: ActionResourceSchema[]
): Promise<boolean[]> => {
  const payload = actionsResourcesList.map(({ action, resource, userAttributes, resourceAttributes = {} }) => ({
    action,
    resource,
    userAttributes,
    resourceAttributes
  }));

  const response = await axios.post(`${url}?user=${user}`, { resourcesAndActions: payload });
  return response.data.permittedList;
};

const getPermissionFromBE = async (
  url: string,
  user: string,
  action: string,
  resource: string,
  defaultPermission: boolean
): Promise<boolean> => {
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

const generateStateKey = (action: string, resource: string, userAttributes: Record<string, any>, resourceAttributes: Record<string, any> = {}): string => {
  const sortedResourceAttributeKeys = Object.keys(resourceAttributes).sort();
  const sortedUserAttributeKeys = Object.keys(userAttributes).sort();

  const sortedResourceAttributes = sortedResourceAttributeKeys.reduce((obj, key) => {
    obj[key] = resourceAttributes[key];
    return obj;
  }, {} as Record<string, any>);

  const sortedUserAttributes = sortedUserAttributeKeys.reduce((obj, key) => {
    obj[key] = userAttributes[key];
    return obj;
  }, {} as Record<string, any>);

  const hasResourceAttributes = sortedResourceAttributeKeys.length > 0;
  const hasUserAttributes = sortedUserAttributeKeys.length > 0;

  const resourceAttributeKey = hasResourceAttributes ? `;resourceAttributes:${JSON.stringify(sortedResourceAttributes)}` : '';
  const userAttributeKey = hasUserAttributes ? `;userAttributes:${JSON.stringify(sortedUserAttributes)}` : ''

  return `user:${userAttributeKey};action:${action};resource:${resource}${resourceAttributeKey}`;
};

export const Permit = ({ loggedInUser, backendUrl, defaultAnswerIfNotExist = false }: PermitProps) => {
  if (!loggedInUser) {
    throw new Error('loggedInUser is required');
  }
  if (!backendUrl || typeof backendUrl !== 'string') {
    throw new Error('backendUrl is required, put your backend check url here');
  }

  // Extracting common components from loadLocalState & loadLocalStateBulk and putting it in a helper function.
  const updatePermissionState = async (actionResource: ActionResourceSchema, permission: boolean) => {
    const { action, resource, userAttributes = {}, resourceAttributes = {} } = actionResource;
    const key = generateStateKey(action, resource, userAttributes, resourceAttributes);
    permitLocalState[key] = permission;
    permitCaslState.push({
      action: action,
      subject: resource,
      inverted: !permission
    });
  };

  const loadLocalState = async (actionsResourcesList: ActionResourceSchema[]) => {
    if (isInitialized) return;
    isInitialized = true;
    for (const actionResource of actionsResourcesList) {
      const permission = await getPermissionFromBE(backendUrl, loggedInUser, actionResource.action, actionResource.resource, defaultAnswerIfNotExist);
      await updatePermissionState(actionResource, permission);
    }
  };

  const loadLocalStateBulk = async (actionsResourcesList: ActionResourceSchema[]) => {
    if (isInitialized) return;
    isInitialized = true;
    const permittedList = await getBulkPermissionFromBE(backendUrl, loggedInUser, actionsResourcesList);
    for (const [i, actionResource] of actionsResourcesList.entries()) {
      await updatePermissionState(actionResource, permittedList[i]);
    }
  };

  const getCaslJson = () => {
    // console.debug(permitCaslState);
    return permitCaslState;
  };

  const check = (action: string, resource: string, userAttributes: Record<string, any>, resourceAttributes: Record<string, any> = {}): boolean => {
    const key = generateStateKey(action, resource, userAttributes, resourceAttributes);
    return permitLocalState[key] ?? defaultAnswerIfNotExist;
  };

  const addKeyToState = async (action: string, resource: string, userAttributes: Record<string, any>, resourceAttributes: Record<string, any> = {}) => {
    const permission = await getPermissionFromBE(backendUrl, loggedInUser, action, resource, defaultAnswerIfNotExist);
    await updatePermissionState({ action, resource, resourceAttributes }, permission);
  };

  permitState = {
    addKeyToState,
    loadLocalState,
    loadLocalStateBulk,
    loggedInUser,
    backendUrl,
    defaultAnswerIfNotExist,
    state: permitLocalState,
    check,
    getCaslJson,
  };

  return permitState;
};
