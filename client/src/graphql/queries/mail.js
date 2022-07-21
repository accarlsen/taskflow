import { gql } from '@apollo/client';


const checkForInv = gql`
    query CheckForInv($userID: ID!){
        checkForInv(userID: $userID){
            fname
            lname 
            email
            
        }
    }`

export{
    checkForInv
}