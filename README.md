# permit-fe-sdk

## Overview

This package lets you easily integrate Permit.io advanced permissions into your frontend application. It is integrated with [CASL](https://casl.js.org/v5/en/) and so can be used with any frontend framework.

## Installation

```bash
npm install permit-fe-sdk
yarn add permit-fe-sdk
```

## Usage

### Setting Up a Backend Route to Fetch Permissions

#### 1. **Example Server**

- Refer to the `demo_server` folder for a sample server configuration.

#### 2. **Communication with PDP**

- The server interacts with the PDP (Policy Decision Point) to fetch permissions for the current user.
- **Note**: It's essential to ensure the PDP is not exposed to the frontend.

#### 3. **Available Endpoints**

- **GET Endpoint**:
  - Purpose: Fetch permissions for a specific resource and action associated with the current user.
- **POST Endpoint (Recommended)**:
  - Purpose: Retrieve permissions in bulk for multiple resources and actions for the current user.

#### 4. **Recommendation**

- Using the POST endpoint is preferable as it reduces the number of requests between the frontend and backend, offering a more efficient data retrieval process.

### Using the SDK in Your Frontend

#### Available Demo Apps

- **React**: Check out the [demo app for React](https://github.com/permitio/fe-demo-react).
- **Angular**: Refer to the [demo app for Angular](https://github.com/permitio/fe-demo-angular).

#### Integration with Other Frontend Frameworks

If you're working with a different frontend framework, consult the [CASL documentation](https://casl.js.org/v5/en/guide/intro). It provides guidance on importing data into CASL ability. This SDK can then help generate the necessary data for CASL.

#### Integration Guide for React:

You can create a react component called an `AbilityLoader` to handle this:

```javascript
import { Ability } from '@casl/ability';
import { Permit, permitState } from 'permit-fe-sdk';

const getAbility = async (loggedInUser) => {
  const permit = Permit({
    loggedInUser: loggedInUser, // This is the unique userId from your authentication provider in the current session.
    backendUrl: '/api/your-endpoint',
  });

  await permit.loadLocalState([
    { action: 'view', resource: 'statement' },
    { action: 'view', resource: 'products' },
    { action: 'delete', resource: 'file' },
    { action: 'create', resource: 'document' },
  ]);

  const caslConfig = permitState.getCaslJson();

  return caslConfig && caslConfig.length ? new Ability(caslConfig) : undefined;
};
```

To utilize the POST Bulk endpoint, refer to the code below. In the following request, be aware that you can optionally
include `resourceAttributes` for the permissions check. However, these attributes are specifically for ABAC permission modeling.
If you're employing RBAC or ReBAC, simply omit them.

```javascript
import { Ability } from '@casl/ability';
import { Permit, permitState } from 'permit-fe-sdk';

const getAbility = async (loggedInUser) => {
  const permit = Permit({
    loggedInUser: loggedInUser,
    backendUrl: '/api/dashboardBulk',
  });

  await permit.loadLocalStateBulk([
    { action: 'view', resource: 'statament' },
    { action: 'view', resource: 'products' },
    { action: 'delete', resource: 'file' },
    { action: 'create', resource: 'document' },
    {
      action: 'view',
      resource: 'files_for_poland_employees',
      userAttributes: {
        department: 'Engineering',
        salary: '100K',
      },
      resourceAttributes: { country: 'PL' },
    },
  ]);

  const caslConfig = permitState.getCaslJson();

  return caslConfig && caslConfig.length ? new Ability(caslConfig) : undefined;
};
```

Once you perform the checks, make sure you check if the current user is signed in and assign them the abilities returned.

```javascript
if (isSignedIn) {
  getAbility(user.id).then((caslAbility) => {
    setAbility(caslAbility);
  });
}
```

If you would like to see how the normal or bulk local states should be handled in your API - refer to the `demo_server`
folder for a sample server configuration.

For any questions, please reach out to us in the [Permit community](https://permit-io.slack.com/join/shared_invite/zt-nz6yjgnp-RlP9rtOPwO0n0aH_vLbmBQ).
