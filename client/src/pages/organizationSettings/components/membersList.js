import { useMutation, useQuery } from '@apollo/client';
import React, { useContext } from 'react';
import AddMember from './addMember';
import UserOrgContext from '../../../components/context/userOrgContext';
import UserContext from '../../../components/context/userContext'
import { getAdminsInOrg, getMembersInOrgID, removeMember } from '../../../graphql/queries/orgs';
import style from './../organizationSettings.module.css';
import Role from './role';


function MembersList({ ownerID, admin, active }) {

    const orgID = useContext(UserOrgContext)

    const userID = useContext(UserContext)

    const { loading, error, data } = useQuery(getMembersInOrgID, {
        variables: orgID
    });

    const [RemoveMember] = useMutation(removeMember, {
        variables: orgID.orgID
    })

    if (loading) return <span>Loading...</span>
    if (error) console.log("error: ", error.message);

    if (data) {
        return (
            <div className={`ma ${style.outerestWrapper}`}>
                <h3 className="mt-8">Edit members:</h3>
                <AddMember active={active} admin={admin} />

                <div className={style.userList}>
                    {data.orgUsers.map((member) => (
                        <div className={style.user} key={member.id}>
                            <p className="p py-2">{member.fname} {member.lname} </p>
                            <Role member={member} ownerID={ownerID} />
                            <p className={`p py-2 ${style.email}`}>{member.email}</p>
                            {member.id !== userID.userID && <button className={`p px-1`} onClick={e => {
                                e.preventDefault();
                                RemoveMember({
                                    variables: {
                                        orgID: orgID.orgID,
                                        email: member.email,
                                    },
                                    refetchQueries:
                                        [
                                            { query: getAdminsInOrg, variables: orgID },
                                            { query: getMembersInOrgID, variables: orgID }
                                        ]
                                });
                            }
                            }>{"X"}</button>}
                        </div>
                    ))}
                </div>
            </div>
        )
    }
    return (
        <div>
            <p className="p m-4">No members</p>
        </div>
    )
}

export default MembersList