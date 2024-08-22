export interface PermitCheckSchema {
  loggedInUser: string;
  userAttributes: Record<string, any>;
  backendUrl: string;
  defaultAnswerIfNotExist: boolean;
  state: PermitStateSchema;
  check: (action: string, resource: string | ReBACResourceSchema, resourceAttributes?: Record<string, any>) => boolean;
  addKeyToState: (action: string, resource: string | ReBACResourceSchema, resourceAttributes?: Record<string, any>) => Promise<void>;
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
  resource: string | ReBACResourceSchema;
  userAttributes?: Record<string, any>;
  resourceAttributes?: Record<string, any>;
}

export interface ReBACResourceSchema {
  type: string;
  key: string;
}
