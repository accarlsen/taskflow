
import { gql } from '@apollo/client';

const login = gql`
    mutation Login(
            $gID: String!,
            $accessToken: String!,
            $email: String!,
            $fname: String!,
            $lname: String!,
            $image: String!
        ) {
            login(input: {
                gID: $gID,
                accessToken: $accessToken,
                email: $email,
                fname: $fname,
                lname: $lname,
                image: $image
            }){ 
            accessToken
            refreshToken
        }
    }
`


const logout = gql`
    mutation Logout {
            logout{ 
            accessToken
            refreshToken
        }
    }
`
const getUser=gql`
    query GetUser($userID: ID!) {
        user(userID: $userID) {
            fname
            lname
            email
        }
    }
`
const renewToken = gql`
    mutation RenewToken($refreshToken: String!) {
        renewToken(
            input: {
                refreshToken: $refreshToken,
            }
        ){ 
            accessToken
            refreshToken
        }
    }
`
const setClaims = gql`
    mutation SetClaims($orgID: ID!) {
        setClaims(
                orgID: $orgID
        ){ 
            accessToken
            refreshToken
        }
    }
`


export {
    login,
    logout,
    getUser,
    renewToken,
    setClaims
}