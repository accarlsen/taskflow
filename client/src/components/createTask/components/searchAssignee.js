import { useQuery } from '@apollo/client';
import React, { useContext, useEffect, useRef, useState } from 'react';
import UserOrgContext from '../../../components/context/userOrgContext';
import { getMembersInOrgID } from '../../../graphql/queries/orgs';
import UserContext from '../../context/userContext';
import AssigneeContext from '../../context/assigneeContext';

import style from './../createTask.module.css';



function SearchAssignee(props) {

    //Deselect dropdown when clikcing outside of it
    const wrapperRef = useRef(null);
    const useOutsideAlerter = (ref) => {
        useEffect(() => {
            /**
             * Alert if clicked on outside of element
             */
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

    const orgID = useContext(UserOrgContext);
    const userID = useContext(UserContext)
    const { assignedID, setAssignedID } = useContext(AssigneeContext)

    const [searchText, setSearchText] = useState("");
    const [filteredUsers, setFilteredUsers] = useState(null)
    const [active, setActive] = useState(false)
    const [selectedUser, setSelectedUser] = useState("")

    const { data: dataU, error: errorU } = useQuery(getMembersInOrgID, {
        variables: { orgID: orgID.orgID }
    })


    useEffect(() => {
        if (dataU) {
            dataU.orgUsers.map(user => {
                if (assignedID === user.id && assignedID === userID.userID) {
                    setSelectedUser("");
                    //setSelectedUser(user.fname + " " + user.lname);
                } else if (assignedID === user.id) {
                    setSelectedUser(user.fname + " " + user.lname);
                }
            })
        }

    }, [dataU, filteredUsers, searchText]);

    if (errorU) console.log(errorU.message)

    if (dataU) {
        return (
            <div ref={wrapperRef}>
                <button className={style.dlButton} onClick={() => {
                    if (!active) setActive(true);
                    else setActive(false)
                }}>{`${selectedUser === "" || selectedUser === "Yourself" ? "+ People" : selectedUser}`}</button>

                {active && <div className={style.dlWrapper}  /*onMouseLeave={() => { if (active) { setActive(false) } }}*/>
                    <input className={`${style.userSelectSearch}`} value={searchText} placeholder={"search name..."} onClick={() => { setActive(true) }} autoFocus={true} onChange={e => {
                        setSearchText(String(e.target.value));
                        setFilteredUsers(dataU.orgUsers.filter(user => {
                            return (user.fname + " " + user.lname + " " + user.email).toLowerCase().includes(String(e.target.value).toLowerCase());
                        }))
                    }}></input>
                    <div className={props.subtaskBool ? style.userSelectOptionsSubtask : style.userSelectOptions} onClick={e => {
                        setSelectedUser("")
                        //setSelectedUser(user.fname + " " + user.lname)
                        setAssignedID(userID.userID)
                        setActive(false)
                    }}>
                        <span>{"Yourself"}</span>
                    </div>
                    {filteredUsers !== null && filteredUsers.map(user => (
                        <div>
                            {userID.userID !== user.id && <div className={props.subtaskBool ? style.userSelectOptionsSubtask : style.userSelectOptions} onClick={e => {
                                setSelectedUser(user.fname + " " + user.lname)
                                setAssignedID(user.id)
                                setActive(false)
                            }}>
                                <span key={user.id}>{user.fname + " " + user.lname}</span>
                            </div>}
                        </div>
                    ))}
                    {filteredUsers === null && dataU.orgUsers.map(user => (
                        <div key={user.id}>
                            {userID.userID !== user.id && <div className={props.subtaskBool ? style.userSelectOptionsSubtask : style.userSelectOptions} onClick={e => {
                                setSelectedUser(user.fname + " " + user.lname)
                                setAssignedID(user.id)
                                setActive(false)
                            }}>
                                <span key={user.id}>{user.fname + " " + user.lname}</span>
                            </div>}
                        </div>
                    ))}
                </div>}
            </div>
        )
    }
    return (
        <div></div>
    )

}

export default SearchAssignee;