import { useMutation, useQuery } from '@apollo/client';
import React, { useContext, useEffect, useRef, useState } from 'react';
import UserOrgContext from '../../../components/context/userOrgContext';
import { getMembersInOrgID } from '../../../graphql/queries/orgs';
import { addMemberToProject, getMembersInProject } from '../../../graphql/queries/project';
import style from './../project.module.css';


function SearchMember(props) {

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

    //Context 
    const orgID = useContext(UserOrgContext);
    const [searchText, setSearchText] = useState("");
    const [filteredUsers, setFilteredUsers] = useState(null)
    const [active, setActive] = useState(false)
    const [selectedUser, setSelectedUser] = useState("")
    const [projectID] = useState(props.project.id);
    const [userID, setUserID] = useState("");

    //Queries
    const { data:dataU, error:errorU } = useQuery(getMembersInOrgID, {
        variables: { orgID: orgID.orgID }
    })

    const [NewMember] = useMutation(addMemberToProject, {
        variables: { projectID: projectID }
    })

    if (errorU) console.log(errorU.message)

    if (dataU) {
        return (
            <div className={`my-1 ${style.inlineSearch}`}>
                <p className="p my-1">{"Add member: "}</p>
                <div className={style.userSelectWrapper} ref={wrapperRef} /*onMouseLeave={() => { if (active) { setActive(false) } }}*/>
                    <input className={`${style.userSelectSearch}`} value={searchText} placeholder={"search user..."} onClick={() => { setActive(true) }} onChange={e => {
                        setSearchText(String(e.target.value));
                        setFilteredUsers(dataU.orgUsers.filter(user => {
                            return (user.fname + " " + user.lname + " " + user.email).toLowerCase().includes(String(e.target.value).toLowerCase());
                        }))
                    }}></input>
                    {filteredUsers !== null && active && filteredUsers.map(user => (
                        <div className={style.userSelectOptions} onClick={e => {
                            setSelectedUser(user.fname + " " + user.lname)
                            setUserID(user.id)
                            e.preventDefault()
                            NewMember({
                                variables: {
                                    projectID: projectID,
                                    userID: user.id
                                },
                                refetchQueries: [{ query: getMembersInProject, variables: {projectID: projectID} }]
                            })
                            setActive(false)
                        }}>
                            <span key={user.id}>{user.fname + " " + user.lname}</span>
                        </div>
                    ))}
                    {filteredUsers === null && active && dataU.orgUsers.map(user => (
                        <div className={style.userSelectOptions} onClick={e => {
                            setSelectedUser(user.fname + " " + user.lname)
                            setUserID(user.id)
                            e.preventDefault()
                            NewMember({
                                variables: {
                                    projectID: projectID,
                                    userID: user.id
                                },
                                refetchQueries: [{ query: getMembersInProject, variables: {projectID: projectID} }]
                            })
                            setActive(false)
                        }}>
                            <span key={user.id}>{user.fname + " " + user.lname}</span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
    return (
        <div></div>
    )

}

export default SearchMember;