import { useMutation } from '@apollo/client';
import React, { useContext, useState } from 'react';
import { addMember, getMembersInOrgID } from '../../../graphql/queries/orgs';
import UserOrgContext from '../../../components/context/userOrgContext';
import style from './../organizationSettings.module.css';
import { useSpring, animated } from 'react-spring'
import Fade from './../../../components/springs/fadeInOutTrans'
import ErrorMessage from './../../../components/errorMessage/errorMessage'



function AddMember({ admin }) {
    const orgID = useContext(UserOrgContext)
    const [active, setActive] = useState(false);
    const [email, setEmail] = useState("");
    const [noErrors, setNoErrors] = useState(true)
    const [userExists, setUserExists] = useState(false)

    const [NewMember, {data, loading, error}] = useMutation(addMember, {
        onCompleted(data){
            if(data.addMember === null || data.addMember === undefined) {
                setNoErrors(false)
                setUserExists(false)
            } else if(data.addMember.numMembers === 0) {
                setNoErrors(false)
                setUserExists(true)
            } else {
                setEmail("")
                setActive(false);
                setNoErrors(true)
                setUserExists(false)
            }
        }
        ,variables: orgID.orgID, email
    })

    const spring = useSpring({ to: { opacity: active ? 1 : 0 } })

    const fadeIn = useSpring({
        from: { opacity: 0 },
        to: { opacity: 1 }
    })

    //Methods
    const validateEmail = (email) => {
        //RFC 2822 compliant regex
        var re = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
        return re.test(email);
    }

    //Event Handlers
    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && validateEmail(email.toLocaleLowerCase)) {
            addExec(event)
        }
        else if (event.key === 'Escape') {
            setActive(false)
            setEmail("")
        }
    }

    //Queries
    const addExec = (e) => {
        e.preventDefault();
        console.log(orgID)
        console.log(email)
        if (validateEmail(email)) {
            const emailL = email.toLowerCase()
            NewMember({
                variables: {
                    orgID: orgID.orgID,
                    email: emailL,
                },
                refetchQueries: [{ query: getMembersInOrgID, variables: { orgID: orgID.orgID } }]
            });
        }
    }


    if (orgID === "" || orgID === undefined || orgID === null) return (
        <p className="p p-2 m-2">{"No org id sat from token"}</p>
    )

    //if(loading) return <Fade show={true}><span className="ma ml-8 p-2 p">Loading...</span></Fade>
    //if(error) return <Fade show={true}><span className="ma ml-8 p-2 p">Error: {error}</span></Fade>

    if (admin) {
        if (!active) return ( //default - retracted
            <Fade show={!active}>
                <button className={`my-3 mb-8 ${"buttonGreen"} `} onClick={() => {
                    setActive(true)
                }}>+ Member</button>
            </Fade>
        )

        return ( //else - expanded
            <animated.div className={"my-3 mb-8"} style={spring}>
                <div className={noErrors ? style.addMember : style.addMemberError} onKeyDown={handleKeyDown}>
                    <input className={` input`} value={email} placeholder={"email..."} autoFocus={true} onChange={e => { setEmail(String(e.target.value)); }}></input>
                    <button className={validateEmail(email) ? "buttonGreen" : "buttonInactive"} onClick={e => addExec(e)}>Add</button>
                    <button className="buttonCancel" onClick={() => { setActive(false); setEmail(""); setNoErrors(true); setUserExists(false) }}>Cancel</button>
                    {!noErrors && <Fade show={!noErrors}><div className={style.errorMsg}><ErrorMessage errorMessage={userExists ? "User allready is a member" :"User not found, Try again..."}></ErrorMessage></div></Fade>}
                </div>
            </animated.div>
        )
    }
    return (
        <div></div>
    )
}

export default AddMember;