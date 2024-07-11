import axios from 'axios';
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
  resource: string;

  resourceAttributes?: Record<string, any>;
}

const getBulkPermissionFromBE = async (url: string, user: string, actionsResourcesList: ActionResourceSchema[]): Promise<boolean[]> => {
  const payload = actionsResourcesList.map((actionResource) => {
    return {
      action: actionResource.action,
      resource: actionResource.resource,
      resourceAttributes: actionResource.resourceAttributes || {},
    };
  });
  return await axios.post(`${url}?user=${user}`, { resourcesAndActions: payload }).then((response) => {
    return response.data.permittedList;
  });
};
const getPermissionFromBE = async (url: string, user: string, action: string, resource: string, defaultPermission: boolean): Promise<boolean> => {
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

const generateStateKey = (action: string, resource: string, resourceAttributes: Record<string, any> = {}) => {
  const sortedAttributes = Object.keys(resourceAttributes)
    .sort()
    .reduce((obj, key) => {
      obj[key] = resourceAttributes[key];
      return obj;
    }, {} as Record<string, any>);
  const attributeKey = resourceAttributes && Object.keys(resourceAttributes).length > 0 ? `;resourceAttributes:${JSON.stringify(sortedAttributes)}` : '';
  return `action:${action};resource:${resource}${attributeKey}`;
};
let permitLocalState: PermitStateSchema = {};
export let permitState: PermitCheckSchema;
export let permitCaslState: CaslPermissionSchema[] = [];

let isInitialized = false;

export type PermitProps = {
  loggedInUser: string;
  backendUrl: string;
  defaultAnswerIfNotExist?: boolean;
};

export const Permit = ({ loggedInUser, backendUrl, defaultAnswerIfNotExist = false }: PermitProps) => {
  if (!loggedInUser) {
    throw new Error('loggedInUser is required');
  }
  if (!backendUrl || typeof backendUrl !== 'string') {
    throw new Error('backendUrl is required, put your backend check url here');
  }

  const loadLocalState = async (actionsResourcesList: ActionResourceSchema[]) => {
    if (!isInitialized) {
      isInitialized = true;
      for (const actionResource of actionsResourcesList) {
        const key = generateStateKey(actionResource.action, actionResource.resource, actionResource.resourceAttributes);
        permitLocalState[key] = await getPermissionFromBE(backendUrl, loggedInUser, actionResource.action, actionResource.resource, defaultAnswerIfNotExist);
        permitCaslState.push({ action: actionResource.action, subject: actionResource.resource, inverted: !permitLocalState[key] });
      }
    }
  };

  const loadLocalStateBulk = async (actionsResourcesList: ActionResourceSchema[]) => {
    if (!isInitialized) {
      isInitialized = true;
      const permittedList = await getBulkPermissionFromBE(backendUrl, loggedInUser, actionsResourcesList);
      let i = 0;
      for (const actionResource of actionsResourcesList) {
        const key = generateStateKey(actionResource.action, actionResource.resource, actionResource.resourceAttributes);
        permitLocalState[key] = permittedList[i];
        i = i + 1;
        permitCaslState.push({ action: actionResource.action, subject: actionResource.resource, inverted: !permitLocalState[key] });
      }
    }
  };

  const getCaslJson = () => {
    // console.debug(permitCaslState);
    return permitCaslState;
  };

  const check = (action: string, resource: string, resourceAttributes: Record<string, any> = {}) => {
    const key = generateStateKey(action, resource, resourceAttributes);
    if (permitLocalState[key]) {
      return permitLocalState[key];
    } else {
      return defaultAnswerIfNotExist;
    }
  };

  const addKeyToState = async (action: string, resource: string, resourceAttributes: Record<string, any> = {}) => {
    const key = generateStateKey(action, resource, resourceAttributes);
    permitLocalState[key] = await getPermissionFromBE(backendUrl, loggedInUser, action, resource, defaultAnswerIfNotExist);
    permitCaslState.push({ action, subject: resource, inverted: !permitLocalState[key] });
  };

  // use function on logout / user permission change
  const reset = () => {
    permitLocalState = {};
    permitCaslState = [];
    isInitialized = false;
  }

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
    reset
  };
  return permitState;
};
