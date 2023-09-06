# permit-fe-sdk

## Overview
This package lets you easily integrate Permit.io advanced permissions into your frontend application. It is integrated with [CASL](https://casl.js.org/v5/en/) and so can be used with any frontend framework.

## Installation
```bash
npm install permit-fe-sdk
yarn add permit-fe-sdk
```

## Usage
### 1. Adding a route in your backend to fetch the permissions
You can see an example server in the demo_server folder.
The server will query the PDP (that shouldn't be exposed to the frontend) and return the permissions for the current user.
Notice that the server has two endpoints:
- GET endpoint to fetch the permissions for the current user for a specific resource and action 
- POST endpoint to fetch the permissions for the current user for bulk resources and actions (recommended)

You can only use one of the endpoints, but the POST endpoint is recommended as it will reduce the number of requests between the frontend and the backend.

### 2. Using the SDK in your frontend
You can see a demo app for [React in this repository](https://github.com/permitio/fe-demo-react)
And a demo app for [Angular in this repository](https://github.com/permitio/fe-demo-angular)
For any other frontend framework, just check the [CASL documentation](https://casl.js.org/v5/en/) to see how to import data into CASL ability and use this SDK to create the data for CASL.

This is how I do it for React:
```javascript
import { Ability } from '@casl/ability';
import { Permit, permitState } from 'permit-fe-sdk';


export const getAbility = async () => {
    const permit = Permit({loggedInUser: "odedbd@gmail.com", backendUrl: "http://localhost:4000/"});
    await permit.loadLocalState([{ action: "create", resource: "file" }, { action: "update", resource: "file" }, { action: "delete", resource: "file" }, { action: "read", resource: "file" }]);
    const caslConfig = permitState.getCaslJson();
    return caslConfig && caslConfig.length? new Ability(caslConfig) : undefined ;
}
```

For any questions, please contact us at [permit.io Slack community](https://permit-io.slack.com/join/shared_invite/zt-nz6yjgnp-RlP9rtOPwO0n0aH_vLbmBQ)