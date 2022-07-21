import { useMutation, useQuery } from '@apollo/client';
import React, { useContext, useEffect, useRef, useState } from 'react';
import UserOrgContext from '../../../components/context/userOrgContext';
import style from './../organizationSettings.module.css';
import { addAdmin, getAdminsInOrg, getMembersInOrgID, removeAdmin } from '../../../graphql/queries/orgs';


function Role(props) {

    //States
    const orgID = useContext(UserOrgContext)
    const [active, setActive] = useState(false);

    //Queries
    const { data } = useQuery(getAdminsInOrg, {
        variables: orgID
    });

    const [RemoveAdmin] = useMutation(removeAdmin, {
        variables: orgID.orgID
    })

    const [NewAdmin] = useMutation(addAdmin, {
        variables: orgID.orgID
    })

    //Authorization
    let owner = false
    let adminAuth = false

    if (props.member.id === props.ownerID) owner = true

    //Deselect dropdown when clikcing outside of it
    const wrapperRef = useRef(null);
    const useOutsideAlerter = (ref) => {
        useEffect(() => {
            function handleClickOutside(event) {
                if (ref.current && !ref.current.contains(event.target)) {
                    setActive(false)
                }
            }

            // Bind the event listener
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                // Unbind the event listener on clean up
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }, [ref]);
    }
    useOutsideAlerter(wrapperRef);

    //Render
    if (data) {
        data.orgAdmins.map((admin) => {
            if (props.member.id === admin.id) {
                adminAuth = true
            }
        })

        if (owner) return (<p className="p py-2">{"(owner)"}</p>)
        else if (adminAuth) return (
            <div className={style.roleWrapper}>
                <div className={style.userSelectWrapper} ref={wrapperRef} >
                    {!active && <div className={style.userSelectedDisplay} onClick={() => { setActive(true) }}>
                        <span className="p">{"Admin"}</span>
                    </div>}
                    {active && <p className={`p ${style.userSelectedDisplay}`} onClick={() => { setActive(false) }}>{"Admin"}</p>}
                    {active && <div className={style.userSelectOptions} onClick={e => {
                        e.preventDefault();
                        RemoveAdmin({
                            variables: {
                                orgID: orgID.orgID,
                                email: props.member.email,
                            },
                            refetchQueries:
                                [
                                    { query: getAdminsInOrg, variables: orgID },
                                    { query: getMembersInOrgID, variables: orgID }
                                ]
                        });
                        setActive(false);
                    }}>
                        <span className="p">{"Member"}</span>
                    </div>}
                </div>
            </div>

        )
        return (
            <div className={style.roleWrapper}>
                <div className={style.userSelectWrapper} ref={wrapperRef} >
                    {!active && <div className={style.userSelectedDisplay} onClick={() => { setActive(true) }}>
                        <span className="p">{"Member"}</span>
                    </div>}
                    {active && <p className={`p ${style.userSelectedDisplay}`} onClick={() => { setActive(false) }}>{"Member"}</p>}
                    {active && <div className={style.userSelectOptions} onClick={e => {
                        e.preventDefault();
                        NewAdmin({
                            variables: {
                                orgID: orgID.orgID,
                                email: props.member.email,
                            },
                            refetchQueries:
                                [
                                    { query: getAdminsInOrg, variables: orgID },
                                    { query: getMembersInOrgID, variables: orgID }
                                ]
                        });
                        setActive(false);
                    }}>
                        <span className="p">{"Admin"}</span>
                    </div>}
                </div>
            </div>
        )
    }

    return (
        <div className="p p-2 m-2">
            No data
        </div >
    )
}

export default Role;