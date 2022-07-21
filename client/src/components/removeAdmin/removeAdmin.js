import { useMutation } from '@apollo/client';
import React, { useContext, useState } from 'react';
import { getAdminsInOrg, getMembersInOrgID, removeAdmin } from '../../graphql/queries/orgs';
import UserOrgContext from '../context/userOrgContext';
import style from './removeAdmin.module.css';
import {useSpring, animated} from 'react-spring'


function RemoveAdmin( {email, owner} ) {

    const orgID = useContext(UserOrgContext)

    const [active, setActive] = useState(false);

    // const [email, setEmail] = useState("");

    const [RemoveAdmin] = useMutation(removeAdmin, {
        variables: orgID.orgID, email
    })

    const spring = useSpring({to: {opacity: active ? 1 : 0}})

    if(orgID === "" || orgID === undefined || orgID === null) return (
        <p className="p m-2 p-2">{"No org id in cookie"}</p>
    )

    if (!active) return ( //default - retracted
        <div>
            <button className={`mt-1 ${owner ? "button3" : "buttonInactive"}  ${owner && style.button}`} onClick={() => {
                if (owner) setActive(true)}
            }>- Remove Admin</button>
        </div>
    )

    return ( //else - expanded
        <animated.div style={spring} >
            <div className={style.wrapper}>
                {/*<input className="m-2" value={email} placeholder={"email..."} autoFocus={true} onChange={e => { setEmail(String(e.target.value)); }}></input>*/}
                <button className="button2 m-4 p-2" onClick={()=>setActive(false)}>Cancel</button>
                <button style={{color:"var(--red)"}} className="button2 m-4 p-2 var(--red)" onClick={e => {
                    e.preventDefault(); //changes default behaviour
                    console.log(email)
                    RemoveAdmin({
                        variables: {
                            orgID: orgID.orgID,
                            email: email,
                        },
                        refetchQueries:
                        [
                            { query: getAdminsInOrg, variables: orgID },
                            { query: getMembersInOrgID, variables: orgID }
                        ]
                    });
                    //setEmail("")
                    setActive(false);
                }
                }>Remove</button>
            </div>
        </animated.div>
    )
}

export default RemoveAdmin;