import { gql } from '@apollo/client';


const getMembersInOrgID = gql`
    query OrgUsers($orgID: ID!){
        orgUsers(orgID: $orgID){
            id
            fname
            lname 
            email
        }
    }`


const getOrg = gql`
    query GetOrg($orgID: ID!) {
        org(orgID: $orgID){
            id
            name
            description
            ownerID
        }
    }
`

const addMember = gql`
    mutation AddMember($orgID: ID!, $email: String!){
        addMember(orgID: $orgID, email: $email) {
            id
            name
            membersID
            adminsID
            numMembers
        }
    }
`

const removeMember = gql`
    mutation RemoveMember($orgID: ID!, $email: String!) {
        removeMember(orgID: $orgID, email: $email) {
            id
            numMembers
            membersID
        }
    }
`

const getAdminsInOrg = gql`
    query GetAdminsInOrg($orgID: ID!) {
        orgAdmins(orgID: $orgID){
            id
            fname
            lname
            email
        }
    }
`

const addAdmin = gql`
    mutation AddAdmin($orgID: ID!, $email: String!){
        addAdmin(orgID: $orgID, email: $email) {
            id
            name
            membersID
            adminsID
            numMembers
        }
    }
`

const removeAdmin = gql`
    mutation RemoveAdmin($orgID: ID!, $email: String!) {
        removeAdmin(orgID: $orgID, email: $email) {
            id
            numMembers
            membersID
        }
    }
`


const updateOrg = gql`
    mutation UpdateOrg($orgID: ID!, $name: String!, $description: String!) {
        updateOrganization(orgID: $orgID, input: {name: $name, description: $description}){
            id
            name
            description
        }
    }
`

const searchOrgUsers = gql`
    query SearchOrganizationUsers($orgID: ID!, $searchText: String!){
        searchOrganizationUsers(orgID: $orgID, searchText: $searchText){
            id
            fname
            lname
        }
    }
`

/*

const deleteOrg = gql`

`*/

// Move this query to queries/users.js
const userOrgs = gql`
    query{
        userOrgs{
            id 
            name
            description
            ownerID
        }
    }
`

const createOrganization = gql`
    mutation CreateOrganization($name: String!, $description: String!){
        createOrganization( input:{name:$name, description:$description})
        {
            id
            name
            description
            ownerID
            membersID
            numMembers
        }
}`


export{
    createOrganization,
    addAdmin,
    removeAdmin,
    updateOrg,
    userOrgs,
    getMembersInOrgID,
    addMember,
    removeMember,
    getOrg,
    getAdminsInOrg,
    searchOrgUsers
}

