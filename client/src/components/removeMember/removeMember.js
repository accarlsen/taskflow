import { useMutation } from '@apollo/client';
import React, { useContext, useState } from 'react';
import { getAdminsInOrg, getMembersInOrgID, removeMember } from '../../graphql/queries/orgs';
import UserOrgContext from '../context/userOrgContext';
import style from './removeMember.module.css';
import {useSpring, animated} from 'react-spring'


function RemoveMember( {email} ) {

    const orgID = useContext(UserOrgContext)

    const [active, setActive] = useState(false);

    // const [email, setEmail] = useState("");

    const [RemoveMember, { errord }] = useMutation(removeMember, {
        variables: orgID.orgID, email
    })

    const spring = useSpring({to: {opacity: active ? 1 : 0}})

    if(orgID == "" || orgID == undefined || orgID == null) return (
        <p> </p>
    )

    if (!active) return ( //default - retracted
        <div className="m-2 p-2">
            <button className="m-2 button3 c-oandr" onClick={() => setActive(true)}>- Remove Member</button>
        </div>
    )

    return ( //else - expanded
        <animated.div style={spring} >
            <div className={style.wrapper}>
                {/*<input className="m-2" value={email} placeholder={"email..."} autoFocus={true} onChange={e => { setEmail(String(e.target.value)); }}></input>*/}
                <button className="button2 m-4 p-2" onClick={()=>setActive(false)}>Cancel</button>
                <button className="button2 m-4 p-2 c-oandr" onClick={e => {
                    e.preventDefault(); //changes default behaviour
                    console.log(email)
                    RemoveMember({
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

export default RemoveMember;