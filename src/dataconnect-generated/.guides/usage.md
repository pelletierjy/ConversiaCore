# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createUser, updateUser, deleteUser, getUser, listUsers, createClassroom, updateClassroom, deleteClassroom, getClassroom, listClassrooms } from '@dataconnect/generated';


// Operation CreateUser: 
const { data } = await CreateUser(dataConnect);

// Operation UpdateUser: 
const { data } = await UpdateUser(dataConnect);

// Operation DeleteUser: 
const { data } = await DeleteUser(dataConnect);

// Operation GetUser: 
const { data } = await GetUser(dataConnect);

// Operation ListUsers: 
const { data } = await ListUsers(dataConnect);

// Operation CreateClassroom: 
const { data } = await CreateClassroom(dataConnect);

// Operation UpdateClassroom:  For variables, look at type UpdateClassroomVars in ../index.d.ts
const { data } = await UpdateClassroom(dataConnect, updateClassroomVars);

// Operation DeleteClassroom:  For variables, look at type DeleteClassroomVars in ../index.d.ts
const { data } = await DeleteClassroom(dataConnect, deleteClassroomVars);

// Operation GetClassroom:  For variables, look at type GetClassroomVars in ../index.d.ts
const { data } = await GetClassroom(dataConnect, getClassroomVars);

// Operation ListClassrooms: 
const { data } = await ListClassrooms(dataConnect);


```