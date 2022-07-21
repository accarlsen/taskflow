import { useQuery } from '@apollo/client';
import React, { useContext } from 'react';
import AddAdmin from '../addAdmin/addAdmin';
import UserOrgContext from '../context/userOrgContext';
import RemoveAdmin from '../removeAdmin/removeAdmin';
import { getAdminsInOrg } from './../../graphql/queries/orgs';
import style from './adminList.module.css';


function AdminList({owner}) {
    
    const orgID = useContext(UserOrgContext)
    const { loading, error, data } = useQuery(getAdminsInOrg, {
        variables: orgID
    });

    if(loading) return <span>Loading...</span>
    if(error) console.log("error: ", error.message);
    
    if(data) {
        if(data.orgAdmins.length === 0){
            return (
            <div className="mt-8 ml-2 ma">
                <AddAdmin />
                <p className="p m-8 ma">No Admins</p>
            </div>
            )
        }
    }
    
    if(data) {
        return(
            <div className={`ma ${style.outerestWrapper}`}>
                <div className={style.inline}>
                    <p className="p ma mt-3 p-2 border-b">Admins:</p>
                    <AddAdmin owner={owner}/> 
                </div>
                <div className={`${style.outerWrapper}`}>
                {data.orgAdmins.map(admin => (
                    <div className={style.wrapper} key={admin.email}>
                        <p className="p m-2 p-2">{admin.fname} {admin.lname}</p>
                        <p className="p ml-2 mt-2 p-2">{admin.email}</p>
                        <RemoveAdmin email={admin.email} owner={owner}/>
                        <p> </p>
                    </div>
                ))}
                </div>
            </div>
        )
    }
    return(
        <div>
            <p className="p m-2 p-2">No Admins</p>
        </div>
    )
}

export default AdminList