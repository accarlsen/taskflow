import React, { useContext } from 'react';
import MembersList from '../../components/membersList/membersList';
import AddAdmin from '../addAdmin/addAdmin';
import AddMember from '../addMember/addMember';
import AdminList from '../adminList/adminList';
import UserOrgContext from '../context/userOrgContext';
import RemoveAdmin from '../removeAdmin/removeAdmin';
import RemoveMember from '../removeMember/removeMember';
import style from './organizationsList.module.css';


function OrganizationsList() {


    const orgID = useContext(UserOrgContext)

        return(
            <div className={style.wrapper}>
                <div className="mt-8 m-8 ma">
                    <MembersList orgID={orgID}/>
                </div>
                <div className="mt-8 m-8 ma">
                    <AddMember orgID={orgID}/>
                    <RemoveMember orgID={orgID}/>
                </div>
                <div className="mt-8 m-8 ma">
                    <AdminList orgID={orgID}/>
                </div>
                <div className="mt-8 m-8 ma">
                    <AddAdmin orgID={orgID}/>
                    <RemoveAdmin orgID={orgID}/>
                </div>
            </div>
        )
}


export default OrganizationsList