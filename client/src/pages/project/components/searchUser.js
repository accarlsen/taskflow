import { useMutation, useQuery } from '@apollo/client';
import React, { useContext, useEffect, useRef, useState } from 'react';
import UserOrgContext from '../../../components/context/userOrgContext';
import { getMembersInOrgID } from '../../../graphql/queries/orgs';
import { getProject, updateProject } from '../../../graphql/queries/project';
import style from './../project.module.css';


function SearchUser(props) {
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

    const orgID = useContext(UserOrgContext);
    const [searchText, setSearchText] = useState("");
    const [filteredUsers, setFilteredUsers] = useState(null)
    const [active, setActive] = useState(false)
    const [selectedUser, setSelectedUser] = useState("")


    const [projectID] = useState(props.project.id);
    const [name] = useState(props.project.name);
    const [description, setDescription] = useState("");
    const [startDate] = useState(new Date(String(props.project.startDate)).toISOString().substring(0, 10));
    const [endDate] = useState(new Date(String(props.project.endDate)).toISOString().substring(0, 10));
    const [projectMonitorID, setProjectMonitorID] = useState("");
    const [currentPhase, setCurrentPhase] = useState(props.project.currentPhase);


    const { data: dataU, error: errorU } = useQuery(getMembersInOrgID, {
        variables: { orgID: orgID.orgID }
    })
 
    const [UpdateProject] = useMutation(updateProject, {
        variables: projectID, name, description, startDate, endDate, projectMonitorID
    })


    useEffect(() => {
        if (dataU) {
            if (props.project.description !== null) setDescription(props.project.description);
            if (props.project.projectMonitorID !== null) setProjectMonitorID(props.project.projectMonitorID);

            dataU.orgUsers.map(user => {
                if (props.project.projectLeadID === user.id) {
                    setSelectedUser(user.fname + " " + user.lname);
                }
            })
        }

    }, [dataU, selectedUser, filteredUsers, searchText]);

    if (errorU) console.log(errorU.message)

    if (dataU) {
        return (
            <div className={style.userSelectWrapper} ref={wrapperRef} /*onMouseLeave={() => { if (active) { setActive(false) } }}*/>
                {!active && <div className={style.userSelectedDisplay} onClick={() => { setActive(true) }}>
                    <span className="p">{selectedUser}</span>
                </div>}
                {active && <input className={`${style.userSelectSearch}`} value={searchText} placeholder={"name..."} onClick={() => { setActive(true) }} autoFocus={true} onChange={e => {
                    setSearchText(String(e.target.value));
                    setFilteredUsers(dataU.orgUsers.filter(user => {
                        return (user.fname + " " + user.lname + " " + user.email).toLowerCase().includes(String(e.target.value).toLowerCase());
                    }))
                }}></input>}
                {filteredUsers !== null && active && filteredUsers.map(user => (
                    <div className={style.userSelectOptions} onClick={e => {
                        setSelectedUser(user.fname + " " + user.lname)
                        e.preventDefault();
                        UpdateProject({
                            variables: {
                                projectID: projectID,
                                name: name,
                                description: description,
                                startDate: startDate,
                                endDate: endDate,
                                archived: false,
                                projectLeadID: user.id,
                                projectMonitorID: projectMonitorID,
                                currentPhase: currentPhase
                            },
                            refetchQueries: [{ query: getProject, variables: { projectID: projectID } }]
                        });
                        setActive(false)
                    }}>
                        <span key={user.id}>{user.fname + " " + user.lname}</span>
                    </div>
                ))}
                {filteredUsers === null && active && dataU.orgUsers.map(user => (
                    <div className={style.userSelectOptions} onClick={e => {
                        setSelectedUser(user.fname + " " + user.lname)
                        e.preventDefault();
                        UpdateProject({
                            variables: {
                                projectID: projectID,
                                name: name,
                                description: description,
                                startDate: startDate,
                                endDate: endDate,
                                archived: false,
                                projectLeadID: user.id,
                                projectMonitorID: projectMonitorID
                            },
                            refetchQueries: [{ query: getProject, variables: { projectID: projectID } }]
                        });
                        setActive(false)
                    }}>
                        <span key={user.id}>{user.fname + " " + user.lname}</span>
                    </div>
                ))}
            </div>
        )
    }
    return (
        <div></div>
    )

}

export default SearchUser;