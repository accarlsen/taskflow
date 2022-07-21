import { useQuery } from '@apollo/client';
import React, { useContext } from 'react';
import UserOrgContext from '../../components/context/userOrgContext';
import EditOrg from './components/editOrg';
import { getOrg } from './../../graphql/queries/orgs';
import style from './organizationSettings.module.css';
import { useSpring, animated } from 'react-spring'
import Cookies from 'universal-cookie';
import jwt_decode from "jwt-decode";
import MembersList from './components/membersList';
import Fade from './../../components/springs/fadeInOutTrans'


function OrganizationSettings() {
    const cookies = new Cookies();
    const accessToken = cookies.get("accessToken");
    var decoded
    if (accessToken){
        decoded = jwt_decode(accessToken);
    } 

    const orgID = useContext(UserOrgContext)

    const { loading, error, data } = useQuery(getOrg, {
        variables: orgID
    });

   

    if (loading) return <span>Loading...</span>
    if (error) console.log("error: ", error.message);

    if (data && decoded) {
        return (
            <Fade show={true}>
                <div className={`${style.wrapper} ma`}>
                    <h2 className="">{"Workplace Settings - " + data.org.name}</h2>
                    <EditOrg
                        imgLink="https://www.materialui.co/materialIcons/editor/mode_edit_white_192x192.png"
                        orgName={data.org.name}
                        orgDescription={data.org.description}
                        owner={decoded?.owner === 1} />
                    <MembersList ownerID={data.org.ownerID} owner={decoded?.owner === 1} admin={decoded?.admin === 1} />

                    {/*<div className={`ma mt-4 ${style.wrapper2}`}>
                        <p className={`p p-2 mb-4 border-b fsize-20 ${style.title}`}>Manage Organization Members</p>

            <AdminList owner={decoded.owner === 1} />
            </div>*/}
                </div>
            </Fade>
        )
    } else {
        return (
            <div className="m-16">
                <p className="p">No data, try reloading...</p>
            </div>
        )
    }
}

export default OrganizationSettings

