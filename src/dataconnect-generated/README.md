# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetUser*](#getuser)
  - [*ListUsers*](#listusers)
  - [*GetClassroom*](#getclassroom)
  - [*ListClassrooms*](#listclassrooms)
  - [*ListMyEnrollments*](#listmyenrollments)
  - [*GetAssignment*](#getassignment)
  - [*ListAssignments*](#listassignments)
  - [*GetSubmission*](#getsubmission)
  - [*ListMySubmissions*](#listmysubmissions)
- [**Mutations**](#mutations)
  - [*CreateUser*](#createuser)
  - [*UpdateUser*](#updateuser)
  - [*DeleteUser*](#deleteuser)
  - [*CreateClassroom*](#createclassroom)
  - [*UpdateClassroom*](#updateclassroom)
  - [*DeleteClassroom*](#deleteclassroom)
  - [*CreateEnrollment*](#createenrollment)
  - [*DeleteEnrollment*](#deleteenrollment)
  - [*CreateAssignment*](#createassignment)
  - [*UpdateAssignment*](#updateassignment)
  - [*DeleteAssignment*](#deleteassignment)
  - [*CreateSubmission*](#createsubmission)
  - [*UpdateSubmission*](#updatesubmission)
  - [*DeleteSubmission*](#deletesubmission)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetUser
You can execute the `GetUser` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getUser(options?: ExecuteQueryOptions): QueryPromise<GetUserData, undefined>;

interface GetUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserData, undefined>;
}
export const getUserRef: GetUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUser(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUserData, undefined>;

interface GetUserRef {
  ...
  (dc: DataConnect): QueryRef<GetUserData, undefined>;
}
export const getUserRef: GetUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserRef:
```typescript
const name = getUserRef.operationName;
console.log(name);
```

### Variables
The `GetUser` query has no variables.
### Return Type
Recall that executing the `GetUser` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetUserData {
  user?: {
    id: UUIDString;
    name: string;
    email: string;
  } & User_Key;
}
```
### Using `GetUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUser } from '@dataconnect/generated';


// Call the `getUser()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUser();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUser(dataConnect);

console.log(data.user);

// Or, you can use the `Promise` API.
getUser().then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

### Using `GetUser`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserRef } from '@dataconnect/generated';


// Call the `getUserRef()` function to get a reference to the query.
const ref = getUserRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.user);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

## ListUsers
You can execute the `ListUsers` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listUsers(options?: ExecuteQueryOptions): QueryPromise<ListUsersData, undefined>;

interface ListUsersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListUsersData, undefined>;
}
export const listUsersRef: ListUsersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listUsers(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListUsersData, undefined>;

interface ListUsersRef {
  ...
  (dc: DataConnect): QueryRef<ListUsersData, undefined>;
}
export const listUsersRef: ListUsersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listUsersRef:
```typescript
const name = listUsersRef.operationName;
console.log(name);
```

### Variables
The `ListUsers` query has no variables.
### Return Type
Recall that executing the `ListUsers` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListUsersData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListUsersData {
  users: ({
    id: UUIDString;
    name: string;
  } & User_Key)[];
}
```
### Using `ListUsers`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listUsers } from '@dataconnect/generated';


// Call the `listUsers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listUsers();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listUsers(dataConnect);

console.log(data.users);

// Or, you can use the `Promise` API.
listUsers().then((response) => {
  const data = response.data;
  console.log(data.users);
});
```

### Using `ListUsers`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listUsersRef } from '@dataconnect/generated';


// Call the `listUsersRef()` function to get a reference to the query.
const ref = listUsersRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listUsersRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.users);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.users);
});
```

## GetClassroom
You can execute the `GetClassroom` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getClassroom(vars: GetClassroomVariables, options?: ExecuteQueryOptions): QueryPromise<GetClassroomData, GetClassroomVariables>;

interface GetClassroomRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetClassroomVariables): QueryRef<GetClassroomData, GetClassroomVariables>;
}
export const getClassroomRef: GetClassroomRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getClassroom(dc: DataConnect, vars: GetClassroomVariables, options?: ExecuteQueryOptions): QueryPromise<GetClassroomData, GetClassroomVariables>;

interface GetClassroomRef {
  ...
  (dc: DataConnect, vars: GetClassroomVariables): QueryRef<GetClassroomData, GetClassroomVariables>;
}
export const getClassroomRef: GetClassroomRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getClassroomRef:
```typescript
const name = getClassroomRef.operationName;
console.log(name);
```

### Variables
The `GetClassroom` query requires an argument of type `GetClassroomVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetClassroomVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetClassroom` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetClassroomData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetClassroomData {
  classroom?: {
    name: string;
    teacher: {
      name: string;
    };
  };
}
```
### Using `GetClassroom`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getClassroom, GetClassroomVariables } from '@dataconnect/generated';

// The `GetClassroom` query requires an argument of type `GetClassroomVariables`:
const getClassroomVars: GetClassroomVariables = {
  id: ..., 
};

// Call the `getClassroom()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getClassroom(getClassroomVars);
// Variables can be defined inline as well.
const { data } = await getClassroom({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getClassroom(dataConnect, getClassroomVars);

console.log(data.classroom);

// Or, you can use the `Promise` API.
getClassroom(getClassroomVars).then((response) => {
  const data = response.data;
  console.log(data.classroom);
});
```

### Using `GetClassroom`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getClassroomRef, GetClassroomVariables } from '@dataconnect/generated';

// The `GetClassroom` query requires an argument of type `GetClassroomVariables`:
const getClassroomVars: GetClassroomVariables = {
  id: ..., 
};

// Call the `getClassroomRef()` function to get a reference to the query.
const ref = getClassroomRef(getClassroomVars);
// Variables can be defined inline as well.
const ref = getClassroomRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getClassroomRef(dataConnect, getClassroomVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.classroom);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.classroom);
});
```

## ListClassrooms
You can execute the `ListClassrooms` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listClassrooms(options?: ExecuteQueryOptions): QueryPromise<ListClassroomsData, undefined>;

interface ListClassroomsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListClassroomsData, undefined>;
}
export const listClassroomsRef: ListClassroomsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listClassrooms(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListClassroomsData, undefined>;

interface ListClassroomsRef {
  ...
  (dc: DataConnect): QueryRef<ListClassroomsData, undefined>;
}
export const listClassroomsRef: ListClassroomsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listClassroomsRef:
```typescript
const name = listClassroomsRef.operationName;
console.log(name);
```

### Variables
The `ListClassrooms` query has no variables.
### Return Type
Recall that executing the `ListClassrooms` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListClassroomsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListClassroomsData {
  classrooms: ({
    name: string;
  })[];
}
```
### Using `ListClassrooms`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listClassrooms } from '@dataconnect/generated';


// Call the `listClassrooms()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listClassrooms();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listClassrooms(dataConnect);

console.log(data.classrooms);

// Or, you can use the `Promise` API.
listClassrooms().then((response) => {
  const data = response.data;
  console.log(data.classrooms);
});
```

### Using `ListClassrooms`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listClassroomsRef } from '@dataconnect/generated';


// Call the `listClassroomsRef()` function to get a reference to the query.
const ref = listClassroomsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listClassroomsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.classrooms);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.classrooms);
});
```

## ListMyEnrollments
You can execute the `ListMyEnrollments` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMyEnrollments(options?: ExecuteQueryOptions): QueryPromise<ListMyEnrollmentsData, undefined>;

interface ListMyEnrollmentsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMyEnrollmentsData, undefined>;
}
export const listMyEnrollmentsRef: ListMyEnrollmentsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMyEnrollments(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMyEnrollmentsData, undefined>;

interface ListMyEnrollmentsRef {
  ...
  (dc: DataConnect): QueryRef<ListMyEnrollmentsData, undefined>;
}
export const listMyEnrollmentsRef: ListMyEnrollmentsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMyEnrollmentsRef:
```typescript
const name = listMyEnrollmentsRef.operationName;
console.log(name);
```

### Variables
The `ListMyEnrollments` query has no variables.
### Return Type
Recall that executing the `ListMyEnrollments` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMyEnrollmentsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListMyEnrollmentsData {
  enrollments: ({
    classroom: {
      name: string;
    };
  })[];
}
```
### Using `ListMyEnrollments`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMyEnrollments } from '@dataconnect/generated';


// Call the `listMyEnrollments()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMyEnrollments();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMyEnrollments(dataConnect);

console.log(data.enrollments);

// Or, you can use the `Promise` API.
listMyEnrollments().then((response) => {
  const data = response.data;
  console.log(data.enrollments);
});
```

### Using `ListMyEnrollments`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMyEnrollmentsRef } from '@dataconnect/generated';


// Call the `listMyEnrollmentsRef()` function to get a reference to the query.
const ref = listMyEnrollmentsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMyEnrollmentsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.enrollments);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.enrollments);
});
```

## GetAssignment
You can execute the `GetAssignment` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getAssignment(vars: GetAssignmentVariables, options?: ExecuteQueryOptions): QueryPromise<GetAssignmentData, GetAssignmentVariables>;

interface GetAssignmentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetAssignmentVariables): QueryRef<GetAssignmentData, GetAssignmentVariables>;
}
export const getAssignmentRef: GetAssignmentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getAssignment(dc: DataConnect, vars: GetAssignmentVariables, options?: ExecuteQueryOptions): QueryPromise<GetAssignmentData, GetAssignmentVariables>;

interface GetAssignmentRef {
  ...
  (dc: DataConnect, vars: GetAssignmentVariables): QueryRef<GetAssignmentData, GetAssignmentVariables>;
}
export const getAssignmentRef: GetAssignmentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getAssignmentRef:
```typescript
const name = getAssignmentRef.operationName;
console.log(name);
```

### Variables
The `GetAssignment` query requires an argument of type `GetAssignmentVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetAssignmentVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetAssignment` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetAssignmentData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetAssignmentData {
  assignment?: {
    title: string;
    dueDate: TimestampString;
  };
}
```
### Using `GetAssignment`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getAssignment, GetAssignmentVariables } from '@dataconnect/generated';

// The `GetAssignment` query requires an argument of type `GetAssignmentVariables`:
const getAssignmentVars: GetAssignmentVariables = {
  id: ..., 
};

// Call the `getAssignment()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getAssignment(getAssignmentVars);
// Variables can be defined inline as well.
const { data } = await getAssignment({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getAssignment(dataConnect, getAssignmentVars);

console.log(data.assignment);

// Or, you can use the `Promise` API.
getAssignment(getAssignmentVars).then((response) => {
  const data = response.data;
  console.log(data.assignment);
});
```

### Using `GetAssignment`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getAssignmentRef, GetAssignmentVariables } from '@dataconnect/generated';

// The `GetAssignment` query requires an argument of type `GetAssignmentVariables`:
const getAssignmentVars: GetAssignmentVariables = {
  id: ..., 
};

// Call the `getAssignmentRef()` function to get a reference to the query.
const ref = getAssignmentRef(getAssignmentVars);
// Variables can be defined inline as well.
const ref = getAssignmentRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getAssignmentRef(dataConnect, getAssignmentVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.assignment);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.assignment);
});
```

## ListAssignments
You can execute the `ListAssignments` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listAssignments(vars: ListAssignmentsVariables, options?: ExecuteQueryOptions): QueryPromise<ListAssignmentsData, ListAssignmentsVariables>;

interface ListAssignmentsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListAssignmentsVariables): QueryRef<ListAssignmentsData, ListAssignmentsVariables>;
}
export const listAssignmentsRef: ListAssignmentsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listAssignments(dc: DataConnect, vars: ListAssignmentsVariables, options?: ExecuteQueryOptions): QueryPromise<ListAssignmentsData, ListAssignmentsVariables>;

interface ListAssignmentsRef {
  ...
  (dc: DataConnect, vars: ListAssignmentsVariables): QueryRef<ListAssignmentsData, ListAssignmentsVariables>;
}
export const listAssignmentsRef: ListAssignmentsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listAssignmentsRef:
```typescript
const name = listAssignmentsRef.operationName;
console.log(name);
```

### Variables
The `ListAssignments` query requires an argument of type `ListAssignmentsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListAssignmentsVariables {
  classroomId: UUIDString;
}
```
### Return Type
Recall that executing the `ListAssignments` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListAssignmentsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListAssignmentsData {
  assignments: ({
    title: string;
  })[];
}
```
### Using `ListAssignments`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listAssignments, ListAssignmentsVariables } from '@dataconnect/generated';

// The `ListAssignments` query requires an argument of type `ListAssignmentsVariables`:
const listAssignmentsVars: ListAssignmentsVariables = {
  classroomId: ..., 
};

// Call the `listAssignments()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listAssignments(listAssignmentsVars);
// Variables can be defined inline as well.
const { data } = await listAssignments({ classroomId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listAssignments(dataConnect, listAssignmentsVars);

console.log(data.assignments);

// Or, you can use the `Promise` API.
listAssignments(listAssignmentsVars).then((response) => {
  const data = response.data;
  console.log(data.assignments);
});
```

### Using `ListAssignments`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listAssignmentsRef, ListAssignmentsVariables } from '@dataconnect/generated';

// The `ListAssignments` query requires an argument of type `ListAssignmentsVariables`:
const listAssignmentsVars: ListAssignmentsVariables = {
  classroomId: ..., 
};

// Call the `listAssignmentsRef()` function to get a reference to the query.
const ref = listAssignmentsRef(listAssignmentsVars);
// Variables can be defined inline as well.
const ref = listAssignmentsRef({ classroomId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listAssignmentsRef(dataConnect, listAssignmentsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.assignments);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.assignments);
});
```

## GetSubmission
You can execute the `GetSubmission` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getSubmission(vars: GetSubmissionVariables, options?: ExecuteQueryOptions): QueryPromise<GetSubmissionData, GetSubmissionVariables>;

interface GetSubmissionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetSubmissionVariables): QueryRef<GetSubmissionData, GetSubmissionVariables>;
}
export const getSubmissionRef: GetSubmissionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getSubmission(dc: DataConnect, vars: GetSubmissionVariables, options?: ExecuteQueryOptions): QueryPromise<GetSubmissionData, GetSubmissionVariables>;

interface GetSubmissionRef {
  ...
  (dc: DataConnect, vars: GetSubmissionVariables): QueryRef<GetSubmissionData, GetSubmissionVariables>;
}
export const getSubmissionRef: GetSubmissionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getSubmissionRef:
```typescript
const name = getSubmissionRef.operationName;
console.log(name);
```

### Variables
The `GetSubmission` query requires an argument of type `GetSubmissionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetSubmissionVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetSubmission` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetSubmissionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetSubmissionData {
  submission?: {
    status: string;
    grade?: number | null;
    teacherFeedback?: string | null;
  };
}
```
### Using `GetSubmission`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getSubmission, GetSubmissionVariables } from '@dataconnect/generated';

// The `GetSubmission` query requires an argument of type `GetSubmissionVariables`:
const getSubmissionVars: GetSubmissionVariables = {
  id: ..., 
};

// Call the `getSubmission()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getSubmission(getSubmissionVars);
// Variables can be defined inline as well.
const { data } = await getSubmission({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getSubmission(dataConnect, getSubmissionVars);

console.log(data.submission);

// Or, you can use the `Promise` API.
getSubmission(getSubmissionVars).then((response) => {
  const data = response.data;
  console.log(data.submission);
});
```

### Using `GetSubmission`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getSubmissionRef, GetSubmissionVariables } from '@dataconnect/generated';

// The `GetSubmission` query requires an argument of type `GetSubmissionVariables`:
const getSubmissionVars: GetSubmissionVariables = {
  id: ..., 
};

// Call the `getSubmissionRef()` function to get a reference to the query.
const ref = getSubmissionRef(getSubmissionVars);
// Variables can be defined inline as well.
const ref = getSubmissionRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getSubmissionRef(dataConnect, getSubmissionVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.submission);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.submission);
});
```

## ListMySubmissions
You can execute the `ListMySubmissions` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMySubmissions(options?: ExecuteQueryOptions): QueryPromise<ListMySubmissionsData, undefined>;

interface ListMySubmissionsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMySubmissionsData, undefined>;
}
export const listMySubmissionsRef: ListMySubmissionsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMySubmissions(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMySubmissionsData, undefined>;

interface ListMySubmissionsRef {
  ...
  (dc: DataConnect): QueryRef<ListMySubmissionsData, undefined>;
}
export const listMySubmissionsRef: ListMySubmissionsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMySubmissionsRef:
```typescript
const name = listMySubmissionsRef.operationName;
console.log(name);
```

### Variables
The `ListMySubmissions` query has no variables.
### Return Type
Recall that executing the `ListMySubmissions` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMySubmissionsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListMySubmissionsData {
  submissions: ({
    status: string;
    assignment: {
      title: string;
    };
  })[];
}
```
### Using `ListMySubmissions`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMySubmissions } from '@dataconnect/generated';


// Call the `listMySubmissions()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMySubmissions();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMySubmissions(dataConnect);

console.log(data.submissions);

// Or, you can use the `Promise` API.
listMySubmissions().then((response) => {
  const data = response.data;
  console.log(data.submissions);
});
```

### Using `ListMySubmissions`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMySubmissionsRef } from '@dataconnect/generated';


// Call the `listMySubmissionsRef()` function to get a reference to the query.
const ref = listMySubmissionsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMySubmissionsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.submissions);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.submissions);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateUser
You can execute the `CreateUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createUser(): MutationPromise<CreateUserData, undefined>;

interface CreateUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateUserData, undefined>;
}
export const createUserRef: CreateUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

interface CreateUserRef {
  ...
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
}
export const createUserRef: CreateUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createUserRef:
```typescript
const name = createUserRef.operationName;
console.log(name);
```

### Variables
The `CreateUser` mutation has no variables.
### Return Type
Recall that executing the `CreateUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateUserData {
  user_insert: User_Key;
}
```
### Using `CreateUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createUser } from '@dataconnect/generated';


// Call the `createUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createUser();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createUser(dataConnect);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
createUser().then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

### Using `CreateUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createUserRef } from '@dataconnect/generated';


// Call the `createUserRef()` function to get a reference to the mutation.
const ref = createUserRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createUserRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

## UpdateUser
You can execute the `UpdateUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateUser(): MutationPromise<UpdateUserData, undefined>;

interface UpdateUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<UpdateUserData, undefined>;
}
export const updateUserRef: UpdateUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateUser(dc: DataConnect): MutationPromise<UpdateUserData, undefined>;

interface UpdateUserRef {
  ...
  (dc: DataConnect): MutationRef<UpdateUserData, undefined>;
}
export const updateUserRef: UpdateUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateUserRef:
```typescript
const name = updateUserRef.operationName;
console.log(name);
```

### Variables
The `UpdateUser` mutation has no variables.
### Return Type
Recall that executing the `UpdateUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateUserData {
  user_update?: User_Key | null;
}
```
### Using `UpdateUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateUser } from '@dataconnect/generated';


// Call the `updateUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateUser();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateUser(dataConnect);

console.log(data.user_update);

// Or, you can use the `Promise` API.
updateUser().then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

### Using `UpdateUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateUserRef } from '@dataconnect/generated';


// Call the `updateUserRef()` function to get a reference to the mutation.
const ref = updateUserRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateUserRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

## DeleteUser
You can execute the `DeleteUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteUser(): MutationPromise<DeleteUserData, undefined>;

interface DeleteUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteUserData, undefined>;
}
export const deleteUserRef: DeleteUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteUser(dc: DataConnect): MutationPromise<DeleteUserData, undefined>;

interface DeleteUserRef {
  ...
  (dc: DataConnect): MutationRef<DeleteUserData, undefined>;
}
export const deleteUserRef: DeleteUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteUserRef:
```typescript
const name = deleteUserRef.operationName;
console.log(name);
```

### Variables
The `DeleteUser` mutation has no variables.
### Return Type
Recall that executing the `DeleteUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteUserData {
  user_delete?: User_Key | null;
}
```
### Using `DeleteUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteUser } from '@dataconnect/generated';


// Call the `deleteUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteUser();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteUser(dataConnect);

console.log(data.user_delete);

// Or, you can use the `Promise` API.
deleteUser().then((response) => {
  const data = response.data;
  console.log(data.user_delete);
});
```

### Using `DeleteUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteUserRef } from '@dataconnect/generated';


// Call the `deleteUserRef()` function to get a reference to the mutation.
const ref = deleteUserRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteUserRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_delete);
});
```

## CreateClassroom
You can execute the `CreateClassroom` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createClassroom(): MutationPromise<CreateClassroomData, undefined>;

interface CreateClassroomRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateClassroomData, undefined>;
}
export const createClassroomRef: CreateClassroomRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createClassroom(dc: DataConnect): MutationPromise<CreateClassroomData, undefined>;

interface CreateClassroomRef {
  ...
  (dc: DataConnect): MutationRef<CreateClassroomData, undefined>;
}
export const createClassroomRef: CreateClassroomRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createClassroomRef:
```typescript
const name = createClassroomRef.operationName;
console.log(name);
```

### Variables
The `CreateClassroom` mutation has no variables.
### Return Type
Recall that executing the `CreateClassroom` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateClassroomData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateClassroomData {
  classroom_insert: Classroom_Key;
}
```
### Using `CreateClassroom`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createClassroom } from '@dataconnect/generated';


// Call the `createClassroom()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createClassroom();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createClassroom(dataConnect);

console.log(data.classroom_insert);

// Or, you can use the `Promise` API.
createClassroom().then((response) => {
  const data = response.data;
  console.log(data.classroom_insert);
});
```

### Using `CreateClassroom`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createClassroomRef } from '@dataconnect/generated';


// Call the `createClassroomRef()` function to get a reference to the mutation.
const ref = createClassroomRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createClassroomRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.classroom_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.classroom_insert);
});
```

## UpdateClassroom
You can execute the `UpdateClassroom` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateClassroom(vars: UpdateClassroomVariables): MutationPromise<UpdateClassroomData, UpdateClassroomVariables>;

interface UpdateClassroomRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateClassroomVariables): MutationRef<UpdateClassroomData, UpdateClassroomVariables>;
}
export const updateClassroomRef: UpdateClassroomRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateClassroom(dc: DataConnect, vars: UpdateClassroomVariables): MutationPromise<UpdateClassroomData, UpdateClassroomVariables>;

interface UpdateClassroomRef {
  ...
  (dc: DataConnect, vars: UpdateClassroomVariables): MutationRef<UpdateClassroomData, UpdateClassroomVariables>;
}
export const updateClassroomRef: UpdateClassroomRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateClassroomRef:
```typescript
const name = updateClassroomRef.operationName;
console.log(name);
```

### Variables
The `UpdateClassroom` mutation requires an argument of type `UpdateClassroomVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateClassroomVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `UpdateClassroom` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateClassroomData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateClassroomData {
  classroom_update?: Classroom_Key | null;
}
```
### Using `UpdateClassroom`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateClassroom, UpdateClassroomVariables } from '@dataconnect/generated';

// The `UpdateClassroom` mutation requires an argument of type `UpdateClassroomVariables`:
const updateClassroomVars: UpdateClassroomVariables = {
  id: ..., 
};

// Call the `updateClassroom()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateClassroom(updateClassroomVars);
// Variables can be defined inline as well.
const { data } = await updateClassroom({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateClassroom(dataConnect, updateClassroomVars);

console.log(data.classroom_update);

// Or, you can use the `Promise` API.
updateClassroom(updateClassroomVars).then((response) => {
  const data = response.data;
  console.log(data.classroom_update);
});
```

### Using `UpdateClassroom`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateClassroomRef, UpdateClassroomVariables } from '@dataconnect/generated';

// The `UpdateClassroom` mutation requires an argument of type `UpdateClassroomVariables`:
const updateClassroomVars: UpdateClassroomVariables = {
  id: ..., 
};

// Call the `updateClassroomRef()` function to get a reference to the mutation.
const ref = updateClassroomRef(updateClassroomVars);
// Variables can be defined inline as well.
const ref = updateClassroomRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateClassroomRef(dataConnect, updateClassroomVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.classroom_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.classroom_update);
});
```

## DeleteClassroom
You can execute the `DeleteClassroom` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteClassroom(vars: DeleteClassroomVariables): MutationPromise<DeleteClassroomData, DeleteClassroomVariables>;

interface DeleteClassroomRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteClassroomVariables): MutationRef<DeleteClassroomData, DeleteClassroomVariables>;
}
export const deleteClassroomRef: DeleteClassroomRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteClassroom(dc: DataConnect, vars: DeleteClassroomVariables): MutationPromise<DeleteClassroomData, DeleteClassroomVariables>;

interface DeleteClassroomRef {
  ...
  (dc: DataConnect, vars: DeleteClassroomVariables): MutationRef<DeleteClassroomData, DeleteClassroomVariables>;
}
export const deleteClassroomRef: DeleteClassroomRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteClassroomRef:
```typescript
const name = deleteClassroomRef.operationName;
console.log(name);
```

### Variables
The `DeleteClassroom` mutation requires an argument of type `DeleteClassroomVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteClassroomVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteClassroom` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteClassroomData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteClassroomData {
  classroom_delete?: Classroom_Key | null;
}
```
### Using `DeleteClassroom`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteClassroom, DeleteClassroomVariables } from '@dataconnect/generated';

// The `DeleteClassroom` mutation requires an argument of type `DeleteClassroomVariables`:
const deleteClassroomVars: DeleteClassroomVariables = {
  id: ..., 
};

// Call the `deleteClassroom()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteClassroom(deleteClassroomVars);
// Variables can be defined inline as well.
const { data } = await deleteClassroom({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteClassroom(dataConnect, deleteClassroomVars);

console.log(data.classroom_delete);

// Or, you can use the `Promise` API.
deleteClassroom(deleteClassroomVars).then((response) => {
  const data = response.data;
  console.log(data.classroom_delete);
});
```

### Using `DeleteClassroom`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteClassroomRef, DeleteClassroomVariables } from '@dataconnect/generated';

// The `DeleteClassroom` mutation requires an argument of type `DeleteClassroomVariables`:
const deleteClassroomVars: DeleteClassroomVariables = {
  id: ..., 
};

// Call the `deleteClassroomRef()` function to get a reference to the mutation.
const ref = deleteClassroomRef(deleteClassroomVars);
// Variables can be defined inline as well.
const ref = deleteClassroomRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteClassroomRef(dataConnect, deleteClassroomVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.classroom_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.classroom_delete);
});
```

## CreateEnrollment
You can execute the `CreateEnrollment` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createEnrollment(vars: CreateEnrollmentVariables): MutationPromise<CreateEnrollmentData, CreateEnrollmentVariables>;

interface CreateEnrollmentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateEnrollmentVariables): MutationRef<CreateEnrollmentData, CreateEnrollmentVariables>;
}
export const createEnrollmentRef: CreateEnrollmentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createEnrollment(dc: DataConnect, vars: CreateEnrollmentVariables): MutationPromise<CreateEnrollmentData, CreateEnrollmentVariables>;

interface CreateEnrollmentRef {
  ...
  (dc: DataConnect, vars: CreateEnrollmentVariables): MutationRef<CreateEnrollmentData, CreateEnrollmentVariables>;
}
export const createEnrollmentRef: CreateEnrollmentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createEnrollmentRef:
```typescript
const name = createEnrollmentRef.operationName;
console.log(name);
```

### Variables
The `CreateEnrollment` mutation requires an argument of type `CreateEnrollmentVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateEnrollmentVariables {
  classroomId: UUIDString;
}
```
### Return Type
Recall that executing the `CreateEnrollment` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateEnrollmentData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateEnrollmentData {
  enrollment_insert: Enrollment_Key;
}
```
### Using `CreateEnrollment`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createEnrollment, CreateEnrollmentVariables } from '@dataconnect/generated';

// The `CreateEnrollment` mutation requires an argument of type `CreateEnrollmentVariables`:
const createEnrollmentVars: CreateEnrollmentVariables = {
  classroomId: ..., 
};

// Call the `createEnrollment()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createEnrollment(createEnrollmentVars);
// Variables can be defined inline as well.
const { data } = await createEnrollment({ classroomId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createEnrollment(dataConnect, createEnrollmentVars);

console.log(data.enrollment_insert);

// Or, you can use the `Promise` API.
createEnrollment(createEnrollmentVars).then((response) => {
  const data = response.data;
  console.log(data.enrollment_insert);
});
```

### Using `CreateEnrollment`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createEnrollmentRef, CreateEnrollmentVariables } from '@dataconnect/generated';

// The `CreateEnrollment` mutation requires an argument of type `CreateEnrollmentVariables`:
const createEnrollmentVars: CreateEnrollmentVariables = {
  classroomId: ..., 
};

// Call the `createEnrollmentRef()` function to get a reference to the mutation.
const ref = createEnrollmentRef(createEnrollmentVars);
// Variables can be defined inline as well.
const ref = createEnrollmentRef({ classroomId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createEnrollmentRef(dataConnect, createEnrollmentVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.enrollment_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.enrollment_insert);
});
```

## DeleteEnrollment
You can execute the `DeleteEnrollment` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteEnrollment(vars: DeleteEnrollmentVariables): MutationPromise<DeleteEnrollmentData, DeleteEnrollmentVariables>;

interface DeleteEnrollmentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteEnrollmentVariables): MutationRef<DeleteEnrollmentData, DeleteEnrollmentVariables>;
}
export const deleteEnrollmentRef: DeleteEnrollmentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteEnrollment(dc: DataConnect, vars: DeleteEnrollmentVariables): MutationPromise<DeleteEnrollmentData, DeleteEnrollmentVariables>;

interface DeleteEnrollmentRef {
  ...
  (dc: DataConnect, vars: DeleteEnrollmentVariables): MutationRef<DeleteEnrollmentData, DeleteEnrollmentVariables>;
}
export const deleteEnrollmentRef: DeleteEnrollmentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteEnrollmentRef:
```typescript
const name = deleteEnrollmentRef.operationName;
console.log(name);
```

### Variables
The `DeleteEnrollment` mutation requires an argument of type `DeleteEnrollmentVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteEnrollmentVariables {
  classroomId: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteEnrollment` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteEnrollmentData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteEnrollmentData {
  enrollment_delete?: Enrollment_Key | null;
}
```
### Using `DeleteEnrollment`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteEnrollment, DeleteEnrollmentVariables } from '@dataconnect/generated';

// The `DeleteEnrollment` mutation requires an argument of type `DeleteEnrollmentVariables`:
const deleteEnrollmentVars: DeleteEnrollmentVariables = {
  classroomId: ..., 
};

// Call the `deleteEnrollment()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteEnrollment(deleteEnrollmentVars);
// Variables can be defined inline as well.
const { data } = await deleteEnrollment({ classroomId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteEnrollment(dataConnect, deleteEnrollmentVars);

console.log(data.enrollment_delete);

// Or, you can use the `Promise` API.
deleteEnrollment(deleteEnrollmentVars).then((response) => {
  const data = response.data;
  console.log(data.enrollment_delete);
});
```

### Using `DeleteEnrollment`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteEnrollmentRef, DeleteEnrollmentVariables } from '@dataconnect/generated';

// The `DeleteEnrollment` mutation requires an argument of type `DeleteEnrollmentVariables`:
const deleteEnrollmentVars: DeleteEnrollmentVariables = {
  classroomId: ..., 
};

// Call the `deleteEnrollmentRef()` function to get a reference to the mutation.
const ref = deleteEnrollmentRef(deleteEnrollmentVars);
// Variables can be defined inline as well.
const ref = deleteEnrollmentRef({ classroomId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteEnrollmentRef(dataConnect, deleteEnrollmentVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.enrollment_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.enrollment_delete);
});
```

## CreateAssignment
You can execute the `CreateAssignment` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createAssignment(vars: CreateAssignmentVariables): MutationPromise<CreateAssignmentData, CreateAssignmentVariables>;

interface CreateAssignmentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateAssignmentVariables): MutationRef<CreateAssignmentData, CreateAssignmentVariables>;
}
export const createAssignmentRef: CreateAssignmentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createAssignment(dc: DataConnect, vars: CreateAssignmentVariables): MutationPromise<CreateAssignmentData, CreateAssignmentVariables>;

interface CreateAssignmentRef {
  ...
  (dc: DataConnect, vars: CreateAssignmentVariables): MutationRef<CreateAssignmentData, CreateAssignmentVariables>;
}
export const createAssignmentRef: CreateAssignmentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createAssignmentRef:
```typescript
const name = createAssignmentRef.operationName;
console.log(name);
```

### Variables
The `CreateAssignment` mutation requires an argument of type `CreateAssignmentVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateAssignmentVariables {
  classroomId: UUIDString;
  title: string;
  dueDate: TimestampString;
}
```
### Return Type
Recall that executing the `CreateAssignment` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateAssignmentData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateAssignmentData {
  assignment_insert: Assignment_Key;
}
```
### Using `CreateAssignment`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createAssignment, CreateAssignmentVariables } from '@dataconnect/generated';

// The `CreateAssignment` mutation requires an argument of type `CreateAssignmentVariables`:
const createAssignmentVars: CreateAssignmentVariables = {
  classroomId: ..., 
  title: ..., 
  dueDate: ..., 
};

// Call the `createAssignment()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createAssignment(createAssignmentVars);
// Variables can be defined inline as well.
const { data } = await createAssignment({ classroomId: ..., title: ..., dueDate: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createAssignment(dataConnect, createAssignmentVars);

console.log(data.assignment_insert);

// Or, you can use the `Promise` API.
createAssignment(createAssignmentVars).then((response) => {
  const data = response.data;
  console.log(data.assignment_insert);
});
```

### Using `CreateAssignment`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createAssignmentRef, CreateAssignmentVariables } from '@dataconnect/generated';

// The `CreateAssignment` mutation requires an argument of type `CreateAssignmentVariables`:
const createAssignmentVars: CreateAssignmentVariables = {
  classroomId: ..., 
  title: ..., 
  dueDate: ..., 
};

// Call the `createAssignmentRef()` function to get a reference to the mutation.
const ref = createAssignmentRef(createAssignmentVars);
// Variables can be defined inline as well.
const ref = createAssignmentRef({ classroomId: ..., title: ..., dueDate: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createAssignmentRef(dataConnect, createAssignmentVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.assignment_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.assignment_insert);
});
```

## UpdateAssignment
You can execute the `UpdateAssignment` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateAssignment(vars: UpdateAssignmentVariables): MutationPromise<UpdateAssignmentData, UpdateAssignmentVariables>;

interface UpdateAssignmentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateAssignmentVariables): MutationRef<UpdateAssignmentData, UpdateAssignmentVariables>;
}
export const updateAssignmentRef: UpdateAssignmentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateAssignment(dc: DataConnect, vars: UpdateAssignmentVariables): MutationPromise<UpdateAssignmentData, UpdateAssignmentVariables>;

interface UpdateAssignmentRef {
  ...
  (dc: DataConnect, vars: UpdateAssignmentVariables): MutationRef<UpdateAssignmentData, UpdateAssignmentVariables>;
}
export const updateAssignmentRef: UpdateAssignmentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateAssignmentRef:
```typescript
const name = updateAssignmentRef.operationName;
console.log(name);
```

### Variables
The `UpdateAssignment` mutation requires an argument of type `UpdateAssignmentVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateAssignmentVariables {
  id: UUIDString;
  title?: string | null;
}
```
### Return Type
Recall that executing the `UpdateAssignment` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateAssignmentData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateAssignmentData {
  assignment_update?: Assignment_Key | null;
}
```
### Using `UpdateAssignment`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateAssignment, UpdateAssignmentVariables } from '@dataconnect/generated';

// The `UpdateAssignment` mutation requires an argument of type `UpdateAssignmentVariables`:
const updateAssignmentVars: UpdateAssignmentVariables = {
  id: ..., 
  title: ..., // optional
};

// Call the `updateAssignment()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateAssignment(updateAssignmentVars);
// Variables can be defined inline as well.
const { data } = await updateAssignment({ id: ..., title: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateAssignment(dataConnect, updateAssignmentVars);

console.log(data.assignment_update);

// Or, you can use the `Promise` API.
updateAssignment(updateAssignmentVars).then((response) => {
  const data = response.data;
  console.log(data.assignment_update);
});
```

### Using `UpdateAssignment`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateAssignmentRef, UpdateAssignmentVariables } from '@dataconnect/generated';

// The `UpdateAssignment` mutation requires an argument of type `UpdateAssignmentVariables`:
const updateAssignmentVars: UpdateAssignmentVariables = {
  id: ..., 
  title: ..., // optional
};

// Call the `updateAssignmentRef()` function to get a reference to the mutation.
const ref = updateAssignmentRef(updateAssignmentVars);
// Variables can be defined inline as well.
const ref = updateAssignmentRef({ id: ..., title: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateAssignmentRef(dataConnect, updateAssignmentVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.assignment_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.assignment_update);
});
```

## DeleteAssignment
You can execute the `DeleteAssignment` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteAssignment(vars: DeleteAssignmentVariables): MutationPromise<DeleteAssignmentData, DeleteAssignmentVariables>;

interface DeleteAssignmentRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteAssignmentVariables): MutationRef<DeleteAssignmentData, DeleteAssignmentVariables>;
}
export const deleteAssignmentRef: DeleteAssignmentRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteAssignment(dc: DataConnect, vars: DeleteAssignmentVariables): MutationPromise<DeleteAssignmentData, DeleteAssignmentVariables>;

interface DeleteAssignmentRef {
  ...
  (dc: DataConnect, vars: DeleteAssignmentVariables): MutationRef<DeleteAssignmentData, DeleteAssignmentVariables>;
}
export const deleteAssignmentRef: DeleteAssignmentRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteAssignmentRef:
```typescript
const name = deleteAssignmentRef.operationName;
console.log(name);
```

### Variables
The `DeleteAssignment` mutation requires an argument of type `DeleteAssignmentVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteAssignmentVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteAssignment` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteAssignmentData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteAssignmentData {
  assignment_delete?: Assignment_Key | null;
}
```
### Using `DeleteAssignment`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteAssignment, DeleteAssignmentVariables } from '@dataconnect/generated';

// The `DeleteAssignment` mutation requires an argument of type `DeleteAssignmentVariables`:
const deleteAssignmentVars: DeleteAssignmentVariables = {
  id: ..., 
};

// Call the `deleteAssignment()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteAssignment(deleteAssignmentVars);
// Variables can be defined inline as well.
const { data } = await deleteAssignment({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteAssignment(dataConnect, deleteAssignmentVars);

console.log(data.assignment_delete);

// Or, you can use the `Promise` API.
deleteAssignment(deleteAssignmentVars).then((response) => {
  const data = response.data;
  console.log(data.assignment_delete);
});
```

### Using `DeleteAssignment`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteAssignmentRef, DeleteAssignmentVariables } from '@dataconnect/generated';

// The `DeleteAssignment` mutation requires an argument of type `DeleteAssignmentVariables`:
const deleteAssignmentVars: DeleteAssignmentVariables = {
  id: ..., 
};

// Call the `deleteAssignmentRef()` function to get a reference to the mutation.
const ref = deleteAssignmentRef(deleteAssignmentVars);
// Variables can be defined inline as well.
const ref = deleteAssignmentRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteAssignmentRef(dataConnect, deleteAssignmentVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.assignment_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.assignment_delete);
});
```

## CreateSubmission
You can execute the `CreateSubmission` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createSubmission(vars: CreateSubmissionVariables): MutationPromise<CreateSubmissionData, CreateSubmissionVariables>;

interface CreateSubmissionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateSubmissionVariables): MutationRef<CreateSubmissionData, CreateSubmissionVariables>;
}
export const createSubmissionRef: CreateSubmissionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createSubmission(dc: DataConnect, vars: CreateSubmissionVariables): MutationPromise<CreateSubmissionData, CreateSubmissionVariables>;

interface CreateSubmissionRef {
  ...
  (dc: DataConnect, vars: CreateSubmissionVariables): MutationRef<CreateSubmissionData, CreateSubmissionVariables>;
}
export const createSubmissionRef: CreateSubmissionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createSubmissionRef:
```typescript
const name = createSubmissionRef.operationName;
console.log(name);
```

### Variables
The `CreateSubmission` mutation requires an argument of type `CreateSubmissionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateSubmissionVariables {
  assignmentId: UUIDString;
  contentUrl: string;
}
```
### Return Type
Recall that executing the `CreateSubmission` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateSubmissionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateSubmissionData {
  submission_insert: Submission_Key;
}
```
### Using `CreateSubmission`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createSubmission, CreateSubmissionVariables } from '@dataconnect/generated';

// The `CreateSubmission` mutation requires an argument of type `CreateSubmissionVariables`:
const createSubmissionVars: CreateSubmissionVariables = {
  assignmentId: ..., 
  contentUrl: ..., 
};

// Call the `createSubmission()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createSubmission(createSubmissionVars);
// Variables can be defined inline as well.
const { data } = await createSubmission({ assignmentId: ..., contentUrl: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createSubmission(dataConnect, createSubmissionVars);

console.log(data.submission_insert);

// Or, you can use the `Promise` API.
createSubmission(createSubmissionVars).then((response) => {
  const data = response.data;
  console.log(data.submission_insert);
});
```

### Using `CreateSubmission`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createSubmissionRef, CreateSubmissionVariables } from '@dataconnect/generated';

// The `CreateSubmission` mutation requires an argument of type `CreateSubmissionVariables`:
const createSubmissionVars: CreateSubmissionVariables = {
  assignmentId: ..., 
  contentUrl: ..., 
};

// Call the `createSubmissionRef()` function to get a reference to the mutation.
const ref = createSubmissionRef(createSubmissionVars);
// Variables can be defined inline as well.
const ref = createSubmissionRef({ assignmentId: ..., contentUrl: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createSubmissionRef(dataConnect, createSubmissionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.submission_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.submission_insert);
});
```

## UpdateSubmission
You can execute the `UpdateSubmission` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateSubmission(vars: UpdateSubmissionVariables): MutationPromise<UpdateSubmissionData, UpdateSubmissionVariables>;

interface UpdateSubmissionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateSubmissionVariables): MutationRef<UpdateSubmissionData, UpdateSubmissionVariables>;
}
export const updateSubmissionRef: UpdateSubmissionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateSubmission(dc: DataConnect, vars: UpdateSubmissionVariables): MutationPromise<UpdateSubmissionData, UpdateSubmissionVariables>;

interface UpdateSubmissionRef {
  ...
  (dc: DataConnect, vars: UpdateSubmissionVariables): MutationRef<UpdateSubmissionData, UpdateSubmissionVariables>;
}
export const updateSubmissionRef: UpdateSubmissionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateSubmissionRef:
```typescript
const name = updateSubmissionRef.operationName;
console.log(name);
```

### Variables
The `UpdateSubmission` mutation requires an argument of type `UpdateSubmissionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateSubmissionVariables {
  id: UUIDString;
  grade?: number | null;
}
```
### Return Type
Recall that executing the `UpdateSubmission` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateSubmissionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateSubmissionData {
  submission_update?: Submission_Key | null;
}
```
### Using `UpdateSubmission`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateSubmission, UpdateSubmissionVariables } from '@dataconnect/generated';

// The `UpdateSubmission` mutation requires an argument of type `UpdateSubmissionVariables`:
const updateSubmissionVars: UpdateSubmissionVariables = {
  id: ..., 
  grade: ..., // optional
};

// Call the `updateSubmission()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateSubmission(updateSubmissionVars);
// Variables can be defined inline as well.
const { data } = await updateSubmission({ id: ..., grade: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateSubmission(dataConnect, updateSubmissionVars);

console.log(data.submission_update);

// Or, you can use the `Promise` API.
updateSubmission(updateSubmissionVars).then((response) => {
  const data = response.data;
  console.log(data.submission_update);
});
```

### Using `UpdateSubmission`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateSubmissionRef, UpdateSubmissionVariables } from '@dataconnect/generated';

// The `UpdateSubmission` mutation requires an argument of type `UpdateSubmissionVariables`:
const updateSubmissionVars: UpdateSubmissionVariables = {
  id: ..., 
  grade: ..., // optional
};

// Call the `updateSubmissionRef()` function to get a reference to the mutation.
const ref = updateSubmissionRef(updateSubmissionVars);
// Variables can be defined inline as well.
const ref = updateSubmissionRef({ id: ..., grade: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateSubmissionRef(dataConnect, updateSubmissionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.submission_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.submission_update);
});
```

## DeleteSubmission
You can execute the `DeleteSubmission` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteSubmission(vars: DeleteSubmissionVariables): MutationPromise<DeleteSubmissionData, DeleteSubmissionVariables>;

interface DeleteSubmissionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteSubmissionVariables): MutationRef<DeleteSubmissionData, DeleteSubmissionVariables>;
}
export const deleteSubmissionRef: DeleteSubmissionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteSubmission(dc: DataConnect, vars: DeleteSubmissionVariables): MutationPromise<DeleteSubmissionData, DeleteSubmissionVariables>;

interface DeleteSubmissionRef {
  ...
  (dc: DataConnect, vars: DeleteSubmissionVariables): MutationRef<DeleteSubmissionData, DeleteSubmissionVariables>;
}
export const deleteSubmissionRef: DeleteSubmissionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteSubmissionRef:
```typescript
const name = deleteSubmissionRef.operationName;
console.log(name);
```

### Variables
The `DeleteSubmission` mutation requires an argument of type `DeleteSubmissionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteSubmissionVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteSubmission` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteSubmissionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteSubmissionData {
  submission_delete?: Submission_Key | null;
}
```
### Using `DeleteSubmission`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteSubmission, DeleteSubmissionVariables } from '@dataconnect/generated';

// The `DeleteSubmission` mutation requires an argument of type `DeleteSubmissionVariables`:
const deleteSubmissionVars: DeleteSubmissionVariables = {
  id: ..., 
};

// Call the `deleteSubmission()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteSubmission(deleteSubmissionVars);
// Variables can be defined inline as well.
const { data } = await deleteSubmission({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteSubmission(dataConnect, deleteSubmissionVars);

console.log(data.submission_delete);

// Or, you can use the `Promise` API.
deleteSubmission(deleteSubmissionVars).then((response) => {
  const data = response.data;
  console.log(data.submission_delete);
});
```

### Using `DeleteSubmission`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteSubmissionRef, DeleteSubmissionVariables } from '@dataconnect/generated';

// The `DeleteSubmission` mutation requires an argument of type `DeleteSubmissionVariables`:
const deleteSubmissionVars: DeleteSubmissionVariables = {
  id: ..., 
};

// Call the `deleteSubmissionRef()` function to get a reference to the mutation.
const ref = deleteSubmissionRef(deleteSubmissionVars);
// Variables can be defined inline as well.
const ref = deleteSubmissionRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteSubmissionRef(dataConnect, deleteSubmissionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.submission_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.submission_delete);
});
```

