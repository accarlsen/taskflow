import { useMutation } from '@apollo/client';
import React, { useContext, useState } from 'react';
import { addAdmin, getAdminsInOrg, getMembersInOrgID } from '../../graphql/queries/orgs';
import UserOrgContext from '../context/userOrgContext';
import style from './addAdmin.module.css';
import {useSpring, animated} from 'react-spring'


function AddAdmin({owner}) {

    const orgID = useContext(UserOrgContext)

    const [active, setActive] = useState(false);

    const [email, setEmail] = useState("");

    const [NewAdmin] = useMutation(addAdmin, {
        variables:  orgID.orgID, email
    })

    const spring = useSpring({to: {opacity: active ? 1 : 0}})

    const fadeIn = useSpring({
        from: {opacity: 0},
        to: {opacity: 1}
    })

    if(orgID === "" || orgID === undefined || orgID === null) return (
        <p className="p-2 m-2 ma">{"No org id found in cookie"}</p>
    )

    if (!active) return ( //default - retracted
        <animated.div style={fadeIn}>
            <button className={`mt-4 mb-4 ${owner ? "button3" : "buttonInactive"} ${owner && style.button}`} onClick={() => 
                {if(owner) setActive(true)}
                }>+ Add Admin</button>
        </animated.div>
    )

    return ( //else - expanded
        <animated.div className={"ma m-3"} style={spring}>
            <div className={style.wrapper}>
                <input className={`m-2 ${style.email}`} value={email} placeholder={"email..."} autoFocus={true} onChange={e => { setEmail(String(e.target.value)); }}></input>
                <button className="button2 m-2" onClick={()=>setActive(false)}>Cancel</button>
                <button style={email.length >= 2 && email.includes("@") ? {backgroundColor: "var(--green)", cursor:"pointer"} : {cursor:"default"}}  className="button2 m-2 c-forestgreen" onClick={e => {
                    e.preventDefault(); //changes default behaviour
                    if(email.length < 2) {
                        return
                    }
                    if(!email.includes("@")) {
                        return
                    } 
                    NewAdmin({
                        variables: {
                            orgID: orgID.orgID,
                            email: email,
                        },
                        refetchQueries: 
                        [
                            { query: getAdminsInOrg, variables: orgID },
                            { query: getMembersInOrgID, variables: orgID}
                        ]
                    });
                    setEmail("")
                    setActive(false);
                }
                }>Add</button>
            </div>
        </animated.div>
    )
}

export default AddAdmin;