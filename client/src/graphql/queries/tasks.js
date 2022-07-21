import { gql } from '@apollo/client';

const getOneTask= gql`
    query($taskID: ID!){
        task(taskID:$taskID)
        {
            id
            name
            description
            assignedID
            progress
            weight
            state
            orgID
            archived
            createTime
            createDate
            deadlineTime
            deadlineDate
            phaseID
            nextTasks
            authorID
            ready
            soonReady
            subtasks{
                id
                name
                description
                assignedID
                progress
                weight
                state
                orgID
                archived
                createTime
                createDate
                deadlineTime
                deadlineDate
                phaseID
                authorID
                parentID
            }
        }
    }
`

const getTasks = gql`
    query{
        tasks{
            id
            name
            description
            assignedID
            progress
            weight
            done
            ready
            soonReady
        }
    }
`
const newTaskPhase = gql`
    mutation NewTaskPhase($name: String!, $description: String, $weight: Int, $assignedID: ID,  $deadlineDate: String!, $deadlineTime: String!, $orgID: ID!, $authorID: ID!, $phaseID: ID!){
        createTask(input: {name: $name, description: $description, weight: $weight, deadlineDate: $deadlineDate, deadlineTime: $deadlineTime, assignedID: $assignedID, orgID: $orgID, authorID: $authorID, phaseID: $phaseID}){
            id
            name
            description
            authorID
            orgID
            phaseID
            assignedID
            progress
            weight
            state
            createDate
            createTime
            deadlineDate
            deadlineTime
            archived
            nextTasks
        }
    }
`

const newTaskOrg = gql`
    mutation NewTaskOrg($name: String!, $description: String, $weight: Int, $assignedID: ID!,  $deadlineDate: String!, $deadlineTime: String!, $orgID: ID!, $authorID: ID!){
        createTask(input: {name: $name, description: $description, weight: $weight, deadlineDate: $deadlineDate, deadlineTime: $deadlineTime, assignedID: $assignedID, orgID: $orgID, authorID: $authorID}){
            id
            name
            description
            weight
            deadlineDate
            deadlineTime
            createDate
            createTime
            orgID
            assignedID
        }
    }
`

const setDone = gql`
    mutation DoneTask($id: ID!, $done: Boolean) {
        doneTask(id: $id, input: {done: $done}){
        id
        done
        }
    }
`

const getAuthorsTasks = gql`
    query GetAuthorsTasks($orgID: ID!, $authorID: ID!, $archived: Boolean!, $period: Int!) {
        tasksByAuthor(orgID: $orgID, authorID: $authorID, archived: $archived, period: $period){
            id
            name
            description
            assignedID
            progress
            weight
            state
            orgID
            archived
            createTime
            createDate
            deadlineTime
            deadlineDate
            phaseID
            nextTasks
            authorID
            ready
            soonReady
            firstTask
            subtaskDeadlines
            subtaskAssignees
            subtasks{
                id
                name
                description
                assignedID
                progress
                weight
                state
                orgID
                archived
                createTime
                createDate
                deadlineTime
                deadlineDate
                phaseID
                authorID
                parentID
            }
        }
    }
`
//6023f04ae4c6144d12529e47
const getAssignedTasks = gql`
    query GetAssignedTasks($orgID: ID!, $assignedID: ID!, $archived: Boolean!, $period: Int!) {
        tasksAssigned(orgID: $orgID, assignedID: $assignedID, archived: $archived, period: $period) {
            id
            name
            description
            assignedID
            progress
            weight
            state
            orgID
            archived
            createTime
            createDate
            deadlineTime
            deadlineDate
            phaseID
            nextTasks
            authorID
            ready
            soonReady
            firstTask
            subtaskAssignees
            subtasks{
                id
                name
                description
                assignedID
                progress
                weight
                state
                orgID
                archived
                createTime
                createDate
                deadlineTime
                deadlineDate
                phaseID
                authorID
                parentID
            }
        }
    }
`

const getTasksInPhase = gql`
    query GetTasksInPhase($phaseID: ID!) {
        tasksInPhase(phaseID: $phaseID) {
            id
            name
            description
            assignedID
            progress
            weight
            state
            orgID
            archived
            createTime
            createDate
            deadlineTime
            deadlineDate
            phaseID
            nextTasks
            authorID
            ready
            soonReady
            firstTask
            subtaskAssignees
            subtasks{
                id
                name
                description
                assignedID
                progress
                weight
                state
                orgID
                archived
                createTime
                createDate
                deadlineTime
                deadlineDate
                phaseID
                authorID
                parentID
            }
        }
    }
`

// Update task connections
const updateTaskDep = gql`
    mutation ($taskID: ID!, $nextTask:ID!, $firstTask: Boolean){
        updateTaskDep(taskID:$taskID, input:{nextTasks:[$nextTask], firstTask: $firstTask}){
            id
            name
            description
            nextTasks
        }
    }
`

const removeTaskDep = gql`
    mutation ($taskID: ID!, $nextTask:ID!){
        removeTaskDep(taskID:$taskID, input:{nextTasks:[$nextTask]}){
            id
            name
            description
            nextTasks
        }
    }
`

const setTaskState = gql`
    mutation SetTaskState($taskID: ID!, $state: String!, $tasksInPara: [String]) {
        updateTaskState(taskID: $taskID, input: {state: $state, tasksInParallell: $tasksInPara}) {
            id
            state
        }
    }
`

const setSubtaskState = gql`
    mutation SetSubtaskState($subtaskID: ID!, $state: String!, $tasksInPara: [String]){
        setSubtaskState(subtaskID: $subtaskID, input: {state: $state, tasksInParallell: $tasksInPara}) {
            id
            name
            parentID
            state
        }
    }   

`

const editTask = gql`
    mutation EditTask($taskID: ID!, $name: String, $description: String, $deadlineDate: String, $deadlineTime: String, $assignedID: ID, $weight: Int, $state: String) {
        updateTask(taskID: $taskID, input: {name: $name, description: $description, deadlineDate: $deadlineDate, deadlineTime: $deadlineTime, assignedID: $assignedID, weight: $weight, state: $state }) {
            id
            name
            description
            deadlineDate
            deadlineTime
            assignedID
        }
    }
`

const editSubtask = gql`
    mutation EditSubtask($subtaskID: ID!, $name: String, $description: String, $deadlineDate: String, $deadlineTime: String, $assignedID: ID, $weight: Int, $state: String) {
        updateSubTask(subtaskID: $subtaskID, input: {name: $name, description: $description, deadlineDate: $deadlineDate, deadlineTime: $deadlineTime, assignedID: $assignedID, weight: $weight, state: $state}) {
            id
            name
            description
            deadlineDate
            deadlineTime
            assignedID
        }
    }
`

const createSubtask = gql`
    mutation CreateSubtask($taskID: ID!, $name: String!, $description: String, $assignedID: ID,  $deadlineDate: String!, $deadlineTime: String!, $orgID: ID, $authorID: ID!, $phaseID: ID, $weight: Int){
        newSubTask(taskID: $taskID, input:{name: $name, description:$description, weight: $weight, deadlineDate: $deadlineDate, deadlineTime: $deadlineTime, assignedID: $assignedID, orgID: $orgID, authorID: $authorID, phaseID: $phaseID }){
            id
            name
            description
            weight
            deadlineDate
            deadlineTime
            createDate
            createTime
            orgID
            assignedID
            parentID
        }
    }
`

const getSubtasksOfParent = gql`
    query GetSubtasksOfParent($taskID:ID!){
        subtasksOfParent(taskID: $taskID){
            id
            name
            description
            assignedID
            progress
            weight
            state
            orgID
            archived
            createTime
            createDate
            deadlineTime
            deadlineDate
            phaseID
            authorID
            parentID
        }
    }

`

const setArchived = gql`
    mutation SetArchived($taskID: ID!, $archived: Boolean!) {
        archiveTask(taskID: $taskID, archived: $archived) {
            id
            archived
        }
    }
`

const setSubtaskArchived = gql`
    mutation SetSubtaskArchived($subtaskID: ID!, $archived: Boolean!){
        archiveSubtask(subtaskID: $subtaskID, input: {archived: $archived}){
            id 
            archived
        }
    }
`

const archiveProject = gql`
    mutation ArchiveProject($projectID: ID!, $archived: Boolean) {
        archiveProject(projectID:$projectID, input:{archived: $archived})
        {
            id
            archived
            name
        }
    }
`
const archivePhase = gql`
    mutation ArchivePhase($phaseID: ID!, $archived: Boolean) {
        archivePhase(phaseID:$phaseID, input:{archived: $archived})
        {
            id
            archived
            name
        }
    }
`

export {
    removeTaskDep,
    getTasksInPhase,
    getOneTask,
    getTasks,
    setDone,
    newTaskOrg,
    getAuthorsTasks,
    getAssignedTasks,
    setTaskState,
    editTask,
    setArchived,
    newTaskPhase,
    updateTaskDep,
    getSubtasksOfParent,
    createSubtask,
    setSubtaskState,
    editSubtask,
    setSubtaskArchived,
    archiveProject,
    archivePhase
}