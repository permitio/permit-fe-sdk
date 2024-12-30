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

#### Custom request headers

If needed, the SDK allows you to pass custom headers to the backend. This can be useful for passing authentication tokens or other necessary information.

```javascript
const permit = Permit({
  loggedInUser: loggedInUser,
  backendUrl: '/api/your-endpoint',
  customRequestHeaders: {
    Authorization: 'Bearer your-token',
  });
```

### Understanding Access Control Models with `loadLocalStateBulk`

When working with access control in your application, it's crucial to understand the differences between various policy models: Role-Based Access Control (RBAC), Attribute-Based Access Control (ABAC), and Relationship-Based Access Control (ReBAC). Each of these models has its own way of determining permissions, which affects how you should configure and pass data to the loadLocalStateBulk function in your application.

#### Common Usage of loadLocalStateBulk

The `loadLocalStateBulk` function allows you to load multiple permission checks at once, optimizing the performance of your application by reducing the number of backend calls. Below is a general example demonstrating how different access control models can be integrated into a single bulk request.

```javascript
const getAbility = async (loggedInUser) => {
  const permit = Permit({
    loggedInUser: loggedInUser, // This is the unique userId from your authentication provider in the current session.
    backendUrl: '/api/your-endpoint',
    // Pass ABAC user attributes
    userAttributes: {user_attr1: "attr_value"},
  });



await permit.loadLocalStateBulk([
  // RBAC example
  { action: 'view', resource: 'statement' },
  { action: 'view', resource: 'products' },
  { action: 'delete', resource: 'file' },

  // ABAC example
  {
    action: 'view',
    resource: 'files_for_poland_employees',
    userAttributes: {
      department: 'Engineering',
      salary: '100K',
    },
    resourceAttributes: { country: 'PL' },
  },

  // ReBAC example
  { action: 'create', resource: 'document:my_file.doc' },
]);
```

Let's break this down into smaller policy-based chunks:

#### Role-Based Access Control (RBAC)

RBAC assigns permissions to users based on their roles within an organization. This is a straightforward model where access rights are predetermined by the user's job function.

##### Example RBAC Usage with `loadLocalStateBulk`

For RBAC, you typically pass the action and resource without any additional attributes:

```javascript
await permit.loadLocalStateBulk([
  { action: 'view', resource: 'statement' },
  { action: 'view', resource: 'products' },
  { action: 'delete', resource: 'file' },
]);
```

In this example:

- `action` represents the type of operation (e.g., 'view', 'delete').
- `resource` represents the object being acted upon (e.g., 'file', 'products').

#### Attribute-Based Access Control (ABAC)

ABAC is more dynamic than RBAC. It grants access based on user attributes, resource attributes, and environment conditions. This model is particularly useful when access control needs to be fine-grained.

##### Example ABAC Usage with loadLocalStateBulk

For ABAC, you include additional userAttributes and resourceAttributes to specify the conditions under which access is granted:

```javascript
await permit.loadLocalStateBulk([
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
```

In this example:

- `userAttributes` defines attributes associated with the user, such as department or salary.
- `resourceAttributes` specifies attributes tied to the resource, like the country of operation.

#### Relationship-Based Access Control (ReBAC)

ReBAC (Relationship-Based Access Control) determines access permissions based on the relationships between users and resources. This model is particularly useful when permissions need to reflect complex relationships, such as group memberships or ownership of specific resources.

##### Example ReBAC Usage with `loadLocalStateBulk`

In ReBAC, you not only specify the action and the resource but also include a resource instance key to identify the specific instance of the resource that the relationship pertains to. This key is essential to precisely define the access control based on the user's relationship to that particular instance.

For example, consider a document management system where permissions are defined based on whether a user is the owner of a document or a member of a group that has access to it.

```javascript
await permit.loadLocalStateBulk([
  {
    action: 'create',
    resource: 'document:my_file.doc', // `document` is the resource type, `my_file.doc` is the resource instance key
  },
]);
```

In this example:

- `action` specifies the operation to be performed (e.g., 'create').
- `resource` consists of two parts:
  - `Resource type` (e.g., 'document')
  - `Resource instance key` (e.g., 'my_file.doc')

The resource instance key (`my_file.doc` in this case) identifies the specific document that the user is allowed to create or manage based on their relationship with it.

To check permissions based on relationships in ReBAC, you can use the permit.check function. This function checks whether a user has the necessary relationship to perform an action on a resource instance.

For example, to check if a user is a member of a specific group that has access to a resource:

```javascript
permit.check(userId, action, {
  type: 'member_group', // Specifies the relationship type
  key: group, // Specifies the particular group key
});
```

Or, using shorthand object notation:

```javascript
permit.check(userId, action, `member_group:${group}`);
```

By including the resource instance key and defining relationships precisely, ReBAC enables fine-grained control over who can perform what actions on specific resource instances based on their relationship with those resources.

#### Integrating RBAC, ABAC, and ReBAC in a Single Request

The flexibility of the loadLocalStateBulk function allows you to mix different access control models in a single request. This can be particularly powerful in applications that require a combination of role-based, attribute-based, and relationship-based access controls.

##### Combined Example

Here is how you can combine all three models in one bulk call:

```javascript
await permit.loadLocalStateBulk([
  // RBAC examples
  { action: 'view', resource: 'statement' },
  { action: 'view', resource: 'products' },
  { action: 'delete', resource: 'file' },

  // ABAC example
  {
    action: 'view',
    resource: 'files_for_poland_employees',
    userAttributes: {
      department: 'Engineering',
      salary: '100K',
    },
    resourceAttributes: { country: 'PL' },
  },

  // ReBAC example
  { action: 'create', resource: 'document:my_file.doc' },
]);
```

By passing a structured array to `loadLocalStateBulk`, you can efficiently manage permissions across different models without needing separate function calls for each model type.

### Applying Abilities to the Signed-In User

After performing the necessary policy checks, the next step is to ensure that the current user is authenticated. Once confirmed, you should assign the abilities returned from the checks to the user. This allows your application to enforce the correct permissions based on the user's access rights.

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
