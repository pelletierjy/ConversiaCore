import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Assignment_Key {
  id: UUIDString;
  __typename?: 'Assignment_Key';
}

export interface Classroom_Key {
  id: UUIDString;
  __typename?: 'Classroom_Key';
}

export interface CreateAssignmentData {
  assignment_insert: Assignment_Key;
}

export interface CreateAssignmentVariables {
  classroomId: UUIDString;
  title: string;
  dueDate: TimestampString;
}

export interface CreateClassroomData {
  classroom_insert: Classroom_Key;
}

export interface CreateEnrollmentData {
  enrollment_insert: Enrollment_Key;
}

export interface CreateEnrollmentVariables {
  classroomId: UUIDString;
}

export interface CreateSubmissionData {
  submission_insert: Submission_Key;
}

export interface CreateSubmissionVariables {
  assignmentId: UUIDString;
  contentUrl: string;
}

export interface CreateUserData {
  user_insert: User_Key;
}

export interface DeleteAssignmentData {
  assignment_delete?: Assignment_Key | null;
}

export interface DeleteAssignmentVariables {
  id: UUIDString;
}

export interface DeleteClassroomData {
  classroom_delete?: Classroom_Key | null;
}

export interface DeleteClassroomVariables {
  id: UUIDString;
}

export interface DeleteEnrollmentData {
  enrollment_delete?: Enrollment_Key | null;
}

export interface DeleteEnrollmentVariables {
  classroomId: UUIDString;
}

export interface DeleteSubmissionData {
  submission_delete?: Submission_Key | null;
}

export interface DeleteSubmissionVariables {
  id: UUIDString;
}

export interface DeleteUserData {
  user_delete?: User_Key | null;
}

export interface Enrollment_Key {
  classroomId: UUIDString;
  studentId: UUIDString;
  __typename?: 'Enrollment_Key';
}

export interface GetAssignmentData {
  assignment?: {
    title: string;
    dueDate: TimestampString;
  };
}

export interface GetAssignmentVariables {
  id: UUIDString;
}

export interface GetClassroomData {
  classroom?: {
    name: string;
    teacher: {
      name: string;
    };
  };
}

export interface GetClassroomVariables {
  id: UUIDString;
}

export interface GetSubmissionData {
  submission?: {
    status: string;
    grade?: number | null;
    teacherFeedback?: string | null;
  };
}

export interface GetSubmissionVariables {
  id: UUIDString;
}

export interface GetUserData {
  user?: {
    id: UUIDString;
    name: string;
    email: string;
  } & User_Key;
}

export interface ListAssignmentsData {
  assignments: ({
    title: string;
  })[];
}

export interface ListAssignmentsVariables {
  classroomId: UUIDString;
}

export interface ListClassroomsData {
  classrooms: ({
    name: string;
  })[];
}

export interface ListMyEnrollmentsData {
  enrollments: ({
    classroom: {
      name: string;
    };
  })[];
}

export interface ListMySubmissionsData {
  submissions: ({
    status: string;
    assignment: {
      title: string;
    };
  })[];
}

export interface ListUsersData {
  users: ({
    id: UUIDString;
    name: string;
  } & User_Key)[];
}

export interface Submission_Key {
  id: UUIDString;
  __typename?: 'Submission_Key';
}

export interface UpdateAssignmentData {
  assignment_update?: Assignment_Key | null;
}

export interface UpdateAssignmentVariables {
  id: UUIDString;
  title?: string | null;
}

export interface UpdateClassroomData {
  classroom_update?: Classroom_Key | null;
}

export interface UpdateClassroomVariables {
  id: UUIDString;
}

export interface UpdateSubmissionData {
  submission_update?: Submission_Key | null;
}

export interface UpdateSubmissionVariables {
  id: UUIDString;
  grade?: number | null;
}

export interface UpdateUserData {
  user_update?: User_Key | null;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(): MutationPromise<CreateUserData, undefined>;
export function createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

interface UpdateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<UpdateUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<UpdateUserData, undefined>;
  operationName: string;
}
export const updateUserRef: UpdateUserRef;

export function updateUser(): MutationPromise<UpdateUserData, undefined>;
export function updateUser(dc: DataConnect): MutationPromise<UpdateUserData, undefined>;

interface DeleteUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<DeleteUserData, undefined>;
  operationName: string;
}
export const deleteUserRef: DeleteUserRef;

export function deleteUser(): MutationPromise<DeleteUserData, undefined>;
export function deleteUser(dc: DataConnect): MutationPromise<DeleteUserData, undefined>;

interface GetUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetUserData, undefined>;
  operationName: string;
}
export const getUserRef: GetUserRef;

export function getUser(options?: ExecuteQueryOptions): QueryPromise<GetUserData, undefined>;
export function getUser(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUserData, undefined>;

interface ListUsersRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListUsersData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListUsersData, undefined>;
  operationName: string;
}
export const listUsersRef: ListUsersRef;

export function listUsers(options?: ExecuteQueryOptions): QueryPromise<ListUsersData, undefined>;
export function listUsers(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListUsersData, undefined>;

interface CreateClassroomRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateClassroomData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateClassroomData, undefined>;
  operationName: string;
}
export const createClassroomRef: CreateClassroomRef;

export function createClassroom(): MutationPromise<CreateClassroomData, undefined>;
export function createClassroom(dc: DataConnect): MutationPromise<CreateClassroomData, undefined>;

interface UpdateClassroomRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateClassroomVariables): MutationRef<UpdateClassroomData, UpdateClassroomVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateClassroomVariables): MutationRef<UpdateClassroomData, UpdateClassroomVariables>;
  operationName: string;
}
export const updateClassroomRef: UpdateClassroomRef;

export function updateClassroom(vars: UpdateClassroomVariables): MutationPromise<UpdateClassroomData, UpdateClassroomVariables>;
export function updateClassroom(dc: DataConnect, vars: UpdateClassroomVariables): MutationPromise<UpdateClassroomData, UpdateClassroomVariables>;

interface DeleteClassroomRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteClassroomVariables): MutationRef<DeleteClassroomData, DeleteClassroomVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteClassroomVariables): MutationRef<DeleteClassroomData, DeleteClassroomVariables>;
  operationName: string;
}
export const deleteClassroomRef: DeleteClassroomRef;

export function deleteClassroom(vars: DeleteClassroomVariables): MutationPromise<DeleteClassroomData, DeleteClassroomVariables>;
export function deleteClassroom(dc: DataConnect, vars: DeleteClassroomVariables): MutationPromise<DeleteClassroomData, DeleteClassroomVariables>;

interface GetClassroomRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetClassroomVariables): QueryRef<GetClassroomData, GetClassroomVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetClassroomVariables): QueryRef<GetClassroomData, GetClassroomVariables>;
  operationName: string;
}
export const getClassroomRef: GetClassroomRef;

export function getClassroom(vars: GetClassroomVariables, options?: ExecuteQueryOptions): QueryPromise<GetClassroomData, GetClassroomVariables>;
export function getClassroom(dc: DataConnect, vars: GetClassroomVariables, options?: ExecuteQueryOptions): QueryPromise<GetClassroomData, GetClassroomVariables>;

interface ListClassroomsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListClassroomsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListClassroomsData, undefined>;
  operationName: string;
}
export const listClassroomsRef: ListClassroomsRef;

export function listClassrooms(options?: ExecuteQueryOptions): QueryPromise<ListClassroomsData, undefined>;
export function listClassrooms(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListClassroomsData, undefined>;

interface CreateEnrollmentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateEnrollmentVariables): MutationRef<CreateEnrollmentData, CreateEnrollmentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateEnrollmentVariables): MutationRef<CreateEnrollmentData, CreateEnrollmentVariables>;
  operationName: string;
}
export const createEnrollmentRef: CreateEnrollmentRef;

export function createEnrollment(vars: CreateEnrollmentVariables): MutationPromise<CreateEnrollmentData, CreateEnrollmentVariables>;
export function createEnrollment(dc: DataConnect, vars: CreateEnrollmentVariables): MutationPromise<CreateEnrollmentData, CreateEnrollmentVariables>;

interface DeleteEnrollmentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteEnrollmentVariables): MutationRef<DeleteEnrollmentData, DeleteEnrollmentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteEnrollmentVariables): MutationRef<DeleteEnrollmentData, DeleteEnrollmentVariables>;
  operationName: string;
}
export const deleteEnrollmentRef: DeleteEnrollmentRef;

export function deleteEnrollment(vars: DeleteEnrollmentVariables): MutationPromise<DeleteEnrollmentData, DeleteEnrollmentVariables>;
export function deleteEnrollment(dc: DataConnect, vars: DeleteEnrollmentVariables): MutationPromise<DeleteEnrollmentData, DeleteEnrollmentVariables>;

interface ListMyEnrollmentsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMyEnrollmentsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListMyEnrollmentsData, undefined>;
  operationName: string;
}
export const listMyEnrollmentsRef: ListMyEnrollmentsRef;

export function listMyEnrollments(options?: ExecuteQueryOptions): QueryPromise<ListMyEnrollmentsData, undefined>;
export function listMyEnrollments(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMyEnrollmentsData, undefined>;

interface CreateAssignmentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateAssignmentVariables): MutationRef<CreateAssignmentData, CreateAssignmentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateAssignmentVariables): MutationRef<CreateAssignmentData, CreateAssignmentVariables>;
  operationName: string;
}
export const createAssignmentRef: CreateAssignmentRef;

export function createAssignment(vars: CreateAssignmentVariables): MutationPromise<CreateAssignmentData, CreateAssignmentVariables>;
export function createAssignment(dc: DataConnect, vars: CreateAssignmentVariables): MutationPromise<CreateAssignmentData, CreateAssignmentVariables>;

interface UpdateAssignmentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateAssignmentVariables): MutationRef<UpdateAssignmentData, UpdateAssignmentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateAssignmentVariables): MutationRef<UpdateAssignmentData, UpdateAssignmentVariables>;
  operationName: string;
}
export const updateAssignmentRef: UpdateAssignmentRef;

export function updateAssignment(vars: UpdateAssignmentVariables): MutationPromise<UpdateAssignmentData, UpdateAssignmentVariables>;
export function updateAssignment(dc: DataConnect, vars: UpdateAssignmentVariables): MutationPromise<UpdateAssignmentData, UpdateAssignmentVariables>;

interface DeleteAssignmentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteAssignmentVariables): MutationRef<DeleteAssignmentData, DeleteAssignmentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteAssignmentVariables): MutationRef<DeleteAssignmentData, DeleteAssignmentVariables>;
  operationName: string;
}
export const deleteAssignmentRef: DeleteAssignmentRef;

export function deleteAssignment(vars: DeleteAssignmentVariables): MutationPromise<DeleteAssignmentData, DeleteAssignmentVariables>;
export function deleteAssignment(dc: DataConnect, vars: DeleteAssignmentVariables): MutationPromise<DeleteAssignmentData, DeleteAssignmentVariables>;

interface GetAssignmentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetAssignmentVariables): QueryRef<GetAssignmentData, GetAssignmentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetAssignmentVariables): QueryRef<GetAssignmentData, GetAssignmentVariables>;
  operationName: string;
}
export const getAssignmentRef: GetAssignmentRef;

export function getAssignment(vars: GetAssignmentVariables, options?: ExecuteQueryOptions): QueryPromise<GetAssignmentData, GetAssignmentVariables>;
export function getAssignment(dc: DataConnect, vars: GetAssignmentVariables, options?: ExecuteQueryOptions): QueryPromise<GetAssignmentData, GetAssignmentVariables>;

interface ListAssignmentsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListAssignmentsVariables): QueryRef<ListAssignmentsData, ListAssignmentsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListAssignmentsVariables): QueryRef<ListAssignmentsData, ListAssignmentsVariables>;
  operationName: string;
}
export const listAssignmentsRef: ListAssignmentsRef;

export function listAssignments(vars: ListAssignmentsVariables, options?: ExecuteQueryOptions): QueryPromise<ListAssignmentsData, ListAssignmentsVariables>;
export function listAssignments(dc: DataConnect, vars: ListAssignmentsVariables, options?: ExecuteQueryOptions): QueryPromise<ListAssignmentsData, ListAssignmentsVariables>;

interface CreateSubmissionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateSubmissionVariables): MutationRef<CreateSubmissionData, CreateSubmissionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateSubmissionVariables): MutationRef<CreateSubmissionData, CreateSubmissionVariables>;
  operationName: string;
}
export const createSubmissionRef: CreateSubmissionRef;

export function createSubmission(vars: CreateSubmissionVariables): MutationPromise<CreateSubmissionData, CreateSubmissionVariables>;
export function createSubmission(dc: DataConnect, vars: CreateSubmissionVariables): MutationPromise<CreateSubmissionData, CreateSubmissionVariables>;

interface UpdateSubmissionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateSubmissionVariables): MutationRef<UpdateSubmissionData, UpdateSubmissionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateSubmissionVariables): MutationRef<UpdateSubmissionData, UpdateSubmissionVariables>;
  operationName: string;
}
export const updateSubmissionRef: UpdateSubmissionRef;

export function updateSubmission(vars: UpdateSubmissionVariables): MutationPromise<UpdateSubmissionData, UpdateSubmissionVariables>;
export function updateSubmission(dc: DataConnect, vars: UpdateSubmissionVariables): MutationPromise<UpdateSubmissionData, UpdateSubmissionVariables>;

interface DeleteSubmissionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteSubmissionVariables): MutationRef<DeleteSubmissionData, DeleteSubmissionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteSubmissionVariables): MutationRef<DeleteSubmissionData, DeleteSubmissionVariables>;
  operationName: string;
}
export const deleteSubmissionRef: DeleteSubmissionRef;

export function deleteSubmission(vars: DeleteSubmissionVariables): MutationPromise<DeleteSubmissionData, DeleteSubmissionVariables>;
export function deleteSubmission(dc: DataConnect, vars: DeleteSubmissionVariables): MutationPromise<DeleteSubmissionData, DeleteSubmissionVariables>;

interface GetSubmissionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetSubmissionVariables): QueryRef<GetSubmissionData, GetSubmissionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetSubmissionVariables): QueryRef<GetSubmissionData, GetSubmissionVariables>;
  operationName: string;
}
export const getSubmissionRef: GetSubmissionRef;

export function getSubmission(vars: GetSubmissionVariables, options?: ExecuteQueryOptions): QueryPromise<GetSubmissionData, GetSubmissionVariables>;
export function getSubmission(dc: DataConnect, vars: GetSubmissionVariables, options?: ExecuteQueryOptions): QueryPromise<GetSubmissionData, GetSubmissionVariables>;

interface ListMySubmissionsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMySubmissionsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListMySubmissionsData, undefined>;
  operationName: string;
}
export const listMySubmissionsRef: ListMySubmissionsRef;

export function listMySubmissions(options?: ExecuteQueryOptions): QueryPromise<ListMySubmissionsData, undefined>;
export function listMySubmissions(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMySubmissionsData, undefined>;

