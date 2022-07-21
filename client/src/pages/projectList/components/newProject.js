import { useMutation, useQuery } from '@apollo/client';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import UserContext from '../../../components/context/userContext';
import UserOrgContext from '../../../components/context/userOrgContext';
import ErrorMessage from '../../../components/errorMessage/errorMessage';
import { getUser } from '../../../graphql/mutations/userMutations';
import { getMembersInOrgID } from '../../../graphql/queries/orgs';
import { getProjectPreviews, newProject } from '../../../graphql/queries/project';
import style from './newProject.module.css';
import Fade from './../../../components/springs/fadeInOutTrans'


function NewProject(props) {
    const history = useHistory();

    const orgID = useContext(UserOrgContext);
    const userID = useContext(UserContext);

    const [searchText, setSearchText] = useState("");
    const [filteredUsers, setFilteredUsers] = useState(null);
    const [active, setActive] = useState(false);
    const [active2, setActive2] = useState(false)
    const [selectedUser, setSelectedUser] = useState("");

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState(new Date(String(new Date())).toISOString().substring(0, 10));
    const [endDate, setEndDate] = useState("");
    const [projectLeadID, setProjectLeadID] = useState(userID.userID)

    //Error feedback
    const [noErrors, setNoErrors] = useState(false);
    const [startDateError, setStartDateError] = useState("")
    const [endDateError, setEndDateError] = useState("")
    const [nameError, setNameError] = useState("");

    //Checks if the given project-name already exists in the organization's project list
    const checkExistingNames = (name) => {
        let nameExists = false
        props.projects.map(project => {
            if (name === project.name) {
                nameExists = true;
                return
            }
        })
        return nameExists
    }

    //Deselect dropdown when clikcing outside of it
    const wrapperRef = useRef(null);
    const useOutsideAlerter = (ref) => {
        useEffect(() => {

            function handleClickOutside(event) {
                if (ref.current && !ref.current.contains(event.target)) {
                    setActive2(false)
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

    //Queries
    const [NewProject] = useMutation(newProject, {
        variables: orgID
    })

    const { data: dataU } = useQuery(getMembersInOrgID, {
        variables: { orgID: orgID.orgID }
    })

    const { data: dataCU } = useQuery(getUser, {
        variables: { userID: userID.userID }
    })

    //Sets the inital project lead to the current user, once current user's info has been queried
    useEffect(() => {
        if (dataCU) {
            setSelectedUser(dataCU.user.fname + " " + dataCU.user.lname);
        }
    }, [dataCU, noErrors]);

    //Render upon recieving user-info from all organization users
    if (dataU) return (
        <Fade fromBottom={true} show={!active}>
            <div className={style.wrapper}>
                <div className={style.innerWrapper}>
                    <div className={`ma ${style.row1}`}>
                        <button className="p exitButton" onClick={() => { history.push("/projects") }}>X</button>

                        <h4 className="mb-3">Create a new project</h4>
                        <input className={`input ${style.name}`} value={name} placeholder={"name..."}
                            onChange={e => {
                                setName(String(e.target.value));
                                let nameErrorT = true;
                                if (String(e.target.value.replace(/\s/g, '')).length >= 3) {
                                    setNameError("")
                                    nameErrorT = false
                                }

                                //Check for all errors
                                if (nameErrorT || startDateError !== "" || endDateError !== "" || startDate === "" || endDate === "") {
                                    setNoErrors(false)
                                } else {
                                    setNoErrors(true)
                                }
                            }}
                            onBlur={e => {
                                let nameErrorT = false
                                if (String(e.target.value.replace(/\s/g, '')).length < 3) {
                                    setNameError("Project name must be longer than 2 characters")
                                    nameErrorT = true;
                                }
                                else if (checkExistingNames(String(e.target.value))) {
                                    setNameError("There aleready exists a project with the same name")
                                    nameErrorT = true;
                                }
                                else setNameError("")

                                //Check for all errors
                                if (nameErrorT || startDateError !== "" || endDateError !== "" || startDate === "" || endDate === "") {
                                    setNoErrors(false)
                                } else setNoErrors(true)
                            }}
                        ></input>
                        <ErrorMessage errorMessage={nameError} />

                        <textarea className={`input mt-3 ${style.description}`} value={description} placeholder={"description (Optional) ..."} onChange={e => { setDescription(String(e.target.value)); }}></textarea>

                        <div className={`my-1 mt-4 ${style.inline}`}>
                            <span className="p my-1">{"Project Lead: "}</span>
                            <div className={style.userSelectWrapper} ref={wrapperRef} >
                                {!active2 && <div className={style.userSelectedDisplay} onClick={() => { setActive2(true) }}>
                                    <span className="p">{selectedUser}</span>
                                </div>}
                                {active && <input className={`${style.userSelectSearch}`} value={searchText} placeholder={"name..."} onClick={() => { setActive(true) }} autoFocus={true} onChange={e => {
                                    setSearchText(String(e.target.value));
                                    setFilteredUsers(dataU.orgUsers.filter(user => {
                                        return (user.fname + " " + user.lname + " " + user.email).toLowerCase().includes(searchText.toLowerCase());
                                    }))
                                }}></input>}
                                {filteredUsers !== null && active2 && filteredUsers.map(user => (
                                        <div className={style.userSelectOptions} onClick={e => {
                                            setSelectedUser(user.fname + " " + user.lname)
                                            setProjectLeadID(user.id)
                                            setActive2(false)
                                        }}>
                                            <span key={user.id}>{user.fname + " " + user.lname}</span>
                                        </div>
                                ))}
                                {filteredUsers === null && active2 && dataU.orgUsers.map(user => (
                                        <div className={style.userSelectOptions} onClick={e => {
                                            setSelectedUser(user.fname + " " + user.lname)
                                            setProjectLeadID(user.id)
                                            setActive2(false)
                                        }}>
                                            <span key={user.id}>{user.fname + " " + user.lname}</span>
                                        </div>
                                ))}
                            </div>
                        </div>

                        <div className={`my-2 mt-3 ${style.inline}`}>
                            <p className="p my-1">{"Start date: "}</p>
                            <div>
                                <input className="input" type="date" value={startDate} onChange={e => {
                                    let startDateErrorT = true
                                    if (endDate === "" || e.target.value < endDate) {
                                        setStartDateError("")
                                        setStartDate(e.target.value)
                                        startDateErrorT = false
                                    } else {
                                        setStartDateError("Start date must be before the end date")
                                        setStartDate(e.target.value)
                                    }

                                    //Check for all errors
                                    if (nameError !== "" || startDateErrorT || endDateError !== "" || endDate === "") {
                                        setNoErrors(false)
                                    } else setNoErrors(true)
                                }}></input>
                                <ErrorMessage errorMessage={startDateError} />
                            </div>
                        </div>

                        <div className={`my-1 ${style.inline}`}>
                            <p className="p my-1">{"End date: "}</p>
                            <div>
                                <input className="input" type="date" value={endDate} onChange={e => {
                                    let endDateErrorT = true
                                    if (startDate === "" || startDate < e.target.value) {
                                        setEndDateError("")
                                        setEndDate(e.target.value);
                                        endDateErrorT = false
                                    } else {
                                        setEndDateError("End date must be after the start date")
                                        setEndDate(e.target.value)
                                    }

                                    //Check for all errors
                                    if (nameError !== "" || startDateError !== "" || endDateErrorT || startDate === "") {
                                        setNoErrors(false)
                                    } else setNoErrors(true)
                                }}></input>
                                <ErrorMessage errorMessage={endDateError} />
                            </div>
                        </div>

                        <div className="mt-6">
                            <button className={`${noErrors ? "buttonGreen" : "buttonInactive"}`} onClick={e => {
                                e.preventDefault();
                                if (noErrors) {
                                    NewProject({
                                        variables: {
                                            name: name,
                                            description: description,
                                            startDate: String(startDate),
                                            endDate: String(endDate),
                                            organizationID: orgID.orgID,
                                            projectLeadID: projectLeadID
                                        },
                                        refetchQueries: [{ query: getProjectPreviews, variables: { orgID: orgID.orgID } }]
                                    });
                                    history.push("/projects")
                                }
                            }}>Create</button>
                            <button className="buttonCancel ml-4" onClick={() => { history.push("/projects") }}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        </Fade>
    )
    return (
        <div></div>
    )
}

export default NewProject