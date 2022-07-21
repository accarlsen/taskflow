import { gql } from '@apollo/client';

const getProjectPreviews = gql`
    query GetProjectPreviews($orgID: ID!) {
        projects(orgID: $orgID){
            id
            name
            progress
            weight
            archived
        }
    }
`

const getProject = gql`
    query GetProject($projectID: ID!) {
        project(projectID: $projectID){
            id
            name
            description
            progress
            weight
            startDate
            endDate
            archived
            currentPhase
            createdByID
            membersID
            projectLeadID
            projectMonitorID
        }
    }
`

const getMembersInProject = gql`
    query GetMembersInProject($projectID: ID!){
        membersInProject(projectID: $projectID){
            id
            fname
            lname
            email
        }
    }
`

const getPhases = gql`
    query GetPhases($projectID: ID!){
        phases(projectID: $projectID){
            id
            name
            startDate
            endDate
            states
            archived
        }
    }
`
/*
const getPhases = gql`
    query {
        phases(projectID: "6037994593a9667076086c82"){
            id
            name
            startDate
            endDate
            states
        }
    }
`*/

const getPhase = gql`
    query GetPhase($phaseID: ID!) {
        phase(phaseID: $phaseID){
            id
            name
            progress
            weight
            startDate
            endDate
            states
            nextPhase
            archived
            projectID
        }
    }
`

const newProject = gql`
    mutation NewProject(
        $name: String!,
        $description: String,
        $startDate: String!,
        $endDate: String!,
        $organizationID: ID!,
        $projectLeadID: ID!,
        $projectMonitorID: ID
    ){
        newProject(
            input: {
                name: $name,
                description: $description,
                startDate: $startDate,
                endDate: $endDate,
                organizationID: $organizationID,
                projectLeadID: $projectLeadID,
                projectMonitorID: $projectMonitorID
            }
        ){
            name
        }
    }
`


const updateProject = gql`
    mutation UpdateProject(
        $projectID: ID!,
        $name: String!,
        $description: String!,
        $startDate: String!,
        $endDate: String!,
        $archived: Boolean!,
        $projectLeadID: ID!,
        $projectMonitorID: ID!,
        $currentPhase: ID!
    ){
        updateProject(
            projectID: $projectID,
            input: {
                name: $name,
                description: $description,
                startDate: $startDate,
                endDate: $endDate,
                archived: $archived,
                projectLeadID: $projectLeadID,
                projectMonitorID: $projectMonitorID,
                currentPhase: $currentPhase
            }
        ){
            name
        }
    }
`

const newPhase = gql`
    mutation NewPhase(
        $name: String!,
        $projectID: ID!,
        $startDate: String!,
        $endDate: String!
    ){
        newPhase(
            input: {
                name: $name,
                projectID: $projectID,
                startDate: $startDate,
                endDate: $endDate,
                progress: 0,
                weight: 0,
                states: ["todo", "done"]
            }
        ){
            id
        }
    }
`

const updatePhase = gql`
    mutation UpdatePhase(
        $phaseID: ID!,
        $name: String!,
        $startDate: String!,
        $endDate: String!
    ){
        updatePhase(
            phaseID: $phaseID,
            input: {
                name: $name,
                startDate: $startDate,
                endDate: $endDate
            }
        ){
            name
        }
    }
`

const newState = gql`
    mutation NewState(
        $phaseID: ID!,
        $state: String!
    ){
        newState(
            phaseID: $phaseID,
            state: $state
        ){
            states
        }
    }
`

const removeState = gql`
    mutation RemoveState(
        $phaseID: ID!,
        $state: String!
    ){
        deleteState(
            phaseID: $phaseID,
            state: $state
        ){
            states
        }
    }
`

const addMemberToProject = gql`
    mutation AddMemberToProject($projectID: ID!, $userID: ID!){
        addMemberToProject(projectID: $projectID, userID: $userID){
            id
        }
    }
`

const removeMemberFromProject = gql`
    mutation RemoveMemberFromProject($projectID: ID!, $userID: ID!){
        removeMemberFromProject(projectID: $projectID, userID: $userID){
            id
        }
    }
`

export {
    getProjectPreviews,
    getProject,
    getMembersInProject,
    getPhases,
    getPhase,
    newProject,
    updateProject,
    newPhase,
    updatePhase,
    newState,
    removeState,
    addMemberToProject,
    removeMemberFromProject
}