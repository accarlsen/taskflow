import { useQuery } from '@apollo/client';
import React, { useContext } from 'react';
import AddMember from '../addMember/addMember';
import AssigneeContext from '../context/assigneeContext';
import UserContext from '../context/userContext';
import UserOrgContext from '../context/userOrgContext';
import RemoveMember from '../removeMember/removeMember';
import { getMembersInOrgID } from './../../graphql/queries/orgs';
import style from './membersList.module.css';


function MembersList( {ownerID, taskMenu} ) {

    const orgID = useContext(UserOrgContext)

    const userID = useContext(UserContext)

    const {assignedID, setAssignedID} = useContext(AssigneeContext)

    const { loading, error, data } = useQuery(getMembersInOrgID, {
        variables: orgID
    });

    if(loading) return <span>Loading...</span>
    if(error) console.log("error: ", error.message);

    if(data) {
        if(data.orgUsers.length == 0){
            return (
            <div className="ml-8 mt-8 ma">
                <AddMember />
                <p className="p m-8 ma">No members</p>
            </div>
            )
        }
    }
    if(data) {
        if(taskMenu) {
            return(
                <div className={style.assignedMenu}>
                     {data.orgUsers.map((member, index) => (
                            <button className={`p ml-2 p-2 mr-2 mb-1 ${style.button}`} key={member.email} onClick={e => {
                                    console.log(member.id)
                                    // Set assignedID
                                    setAssignedID(member.id)
                                    setAssignedID(member.id)
                                    console.log(assignedID)
                            }}>{member.fname} {member.lname}</button>
                    ))}
                </div>
            )
        } else {
            return(
                <div className={`ma ${style.outerestWrapper}`}>
                    <div className={style.inline}>
                        <p className="p p-2 mt-3 ma border-b">Members:</p>
                        <AddMember />
                    </div>
                    
                    <div className={style.outerWrapper}>
                        {data.orgUsers.map((member, index) => (
                            <div className={style.wrapper} key={member.email}>
                                <p className="p m-2 p-2">{member.fname} {member.lname} {member.id == ownerID ? ' (Owner)' : ''}</p>
                                <p className="p m-2 p-2">{member.email}</p>
                                <RemoveMember email={member.email} />
                                <p> </p>
                            </div>
                        ))}
                    </div>
                </div>
            )
        }
    }
    return(
        <div>
            <p className="p m-4">No members</p>
        </div>
    )
}

export default MembersList