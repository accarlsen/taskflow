import { useMutation } from '@apollo/client';
import React, { useContext, useState } from 'react';
import { addMember, getMembersInOrgID } from '../../graphql/queries/orgs';
import UserOrgContext from '../context/userOrgContext';
import style from './addMember.module.css';
import {useSpring, animated} from 'react-spring'



function AddMember() {

    const orgID = useContext(UserOrgContext)

    const [active, setActive] = useState(false);

    const [email, setEmail] = useState("");

    const [NewMember, { errord }] = useMutation(addMember, {
        variables: orgID.orgID, email
    })

    const spring = useSpring({to: {opacity: active ? 1 : 0}})

    const fadeIn = useSpring({
        from: {opacity: 0},
        to: {opacity: 1}
    })

    if(orgID == "" || orgID == undefined || orgID == null) return (
        <p> </p>
    )

    if (!active) return ( //default - retracted
        <animated.div style={fadeIn}>
            <button className="ma m-4 ml-10 button3 c-forestgreen" onClick={() => setActive(true)}>+ Add Member</button>
        </animated.div>
    )

    return ( //else - expanded
        <animated.div className={"ma m-3"} style={spring}>
            <div className={style.wrapper}>
                <input className="m-2" value={email} placeholder={"email..."} autoFocus={true} onChange={e => { setEmail(String(e.target.value)); }}></input>
                <button className="button2 m-2" onClick={()=>setActive(false)}>Cancel</button>
                <button className="button2 m-2 c-forestgreen" onClick={e => {
                    e.preventDefault(); //changes default behaviour
                    console.log(orgID)
                    NewMember({
                        variables: {
                            orgID: orgID.orgID,
                            email: email,
                        },
                        refetchQueries: [{ query: getMembersInOrgID, variables: orgID.orgID }]
                    });
                    setEmail("")
                    setActive(false);
                }
                }>Add</button>
            </div>
        </animated.div>
    )
}

export default AddMember;