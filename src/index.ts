import axios from 'axios';

// Interfaces

export interface PermitCheckSchema {
  loggedInUser: string;
  backendUrl: string;
  defaultAnswerIfNotExist: boolean;
  state: PermitStateSchema;
  check: (action: string, resource: string, resourceAttributes?: Record<string, any>) => boolean;
  addKeyToState: (action: string, resource: string, resourceAttributes?: Record<string, any>) => Promise<void>;
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
  const payload = actionsResourcesList.map(({ action, resource, resourceAttributes = {} }) => ({
    action,
    resource,
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

const generateStateKey = (action: string, resource: string, resourceAttributes: Record<string, any> = {}): string => {
  const sortedAttributesKeys = Object.keys(resourceAttributes).sort();

  const sortedAttributes = sortedAttributesKeys.reduce((obj, key) => {
    obj[key] = resourceAttributes[key];
    return obj;
  }, {} as Record<string, any>);

  const hasAttributes = sortedAttributesKeys.length > 0;
  const attributeKey = hasAttributes ? `;resourceAttributes:${JSON.stringify(sortedAttributes)}` : '';

  return `action:${action};resource:${resource}${attributeKey}`;
};

export const Permit = ({ loggedInUser, backendUrl, defaultAnswerIfNotExist = false }: PermitProps) => {
  if (!loggedInUser) {
    throw new Error('loggedInUser is required');
  }
  if (!backendUrl || typeof backendUrl !== 'string') {
    throw new Error('backendUrl is required, put your backend check url here');
  }

  const updatePermissionState = async (actionResource: ActionResourceSchema, permission: boolean) => {
    const key = generateStateKey(actionResource.action, actionResource.resource, actionResource.resourceAttributes);
    permitLocalState[key] = permission;
    permitCaslState.push({
      action: actionResource.action,
      subject: actionResource.resource,
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

  const check = (action: string, resource: string, resourceAttributes: Record<string, any> = {}): boolean => {
    const key = generateStateKey(action, resource, resourceAttributes);
    return permitLocalState[key] ?? defaultAnswerIfNotExist;
  };

  const addKeyToState = async (action: string, resource: string, resourceAttributes: Record<string, any> = {}) => {
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
