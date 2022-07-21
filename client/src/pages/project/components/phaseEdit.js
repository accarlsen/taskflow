import { useMutation, useQuery } from '@apollo/client';
import React, { useState } from 'react';
import ErrorMessage from '../../../components/errorMessage/errorMessage';
import { getPhase, getPhases, newState, removeState, updatePhase, updateProject, getProject } from '../../../graphql/queries/project';
import { archivePhase } from '../../../graphql/queries/tasks';
import style from './../project.module.css';


function PhaseEdit(props) {
    const projectID = window.location.href.split("/")[window.location.href.split("/").length - 1];

    const [phaseID] = useState(String(props.phase.id))
    const [stateAdd, setStateAdd] = useState(false);
    const [newStateName, setNewStateName] = useState("");
    const [edited, setEdited] = useState(false);
    const [name, setName] = useState(props.phase.name);
    const [startDate, setStartDate] = useState(props.phase.startDate);
    const [endDate, setEndDate] = useState(props.phase.endDate);

    //Error feedback
    const [noErrors, setNoErrors] = useState(false);
    const [startDateError, setStartDateError] = useState("")
    const [endDateError, setEndDateError] = useState("")
    const [nameError, setNameError] = useState("");

    //Checks if the given project-name already exists in the organization's project list
    const checkExistingNames = (name) => {
        let nameExists = false
        props.phases.map(phase => {
            if (name !== props.phase.name && name === phase.name) {
                nameExists = true;
                return
            }
        })
        return nameExists
    }

    //Queries
    const [NewState] = useMutation(newState, {
        variables: { phaseID: phaseID }
    })
    const [UpdateProject] = useMutation(updateProject, {
        variables: {}
    });

    const [RemoveState] = useMutation(removeState, {
        variables: { phaseID: phaseID }
    })

    const [UpdatePhase] = useMutation(updatePhase, {
        variables: phaseID, name, startDate, endDate
    })

    const [ArchivePhase] = useMutation(archivePhase, {
        variables: phaseID
    })

    return (
        <div className={style.phaseEditWrapper}>
            {!props.phase.archived ? <h4 className="mb-4">{props.phase.name}</h4> : <h4 className="mb-4">{props.phase.name + " - Archived"}</h4>}
            <div className={style.phaseEditGrid}>
                <div>
                    <div className={`my-1 ${style.inlineD}`}>
                        <p className="p">{"Name: "}</p>
                        <div>
                            <input className={`input ${style.nameD}`} value={name} placeholder={"name..."}
                                onChange={e => {
                                    setName(String(e.target.value));
                                    setEdited(true);
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
                                }}></input>
                            <ErrorMessage errorMessage={nameError} />
                        </div>
                    </div>
                    <div className={`my-1 ${style.inlineD}`}>
                        <p className="p my-1">{"Start date: "}</p>
                        <div>
                            <input className="input" type="date" min={props.projectStart} max={props.projectEnd} value={startDate}
                                onChange={e => {
                                    let startDateErrorT = true
                                    if (endDate === "" || e.target.value < endDate) {
                                        setStartDateError("")
                                        setStartDate(e.target.value)
                                        setEdited(true)
                                        startDateErrorT = false
                                    } else {
                                        setStartDateError("Start date must be before the end date")
                                        setStartDate("")
                                    }

                                    //Check for all errors
                                    if (nameError !== "" || startDateErrorT || endDateError !== "" || endDate === "") {
                                        setNoErrors(false)
                                    } else setNoErrors(true)
                                }}></input>
                            <ErrorMessage errorMessage={startDateError} />
                        </div>
                    </div>
                    <div className={`my-1 ${style.inlineD}`}>
                        <p className="p my-1">{"End date: "}</p>
                        <div>
                            <input className="input" type="date" min={props.projectStart} max={props.projectEnd} value={endDate}
                                onChange={e => {
                                    let endDateErrorT = true
                                    if (startDate === "" || startDate < e.target.value) {
                                        setEndDateError("")
                                        setEndDate(e.target.value);
                                        setEdited(true)
                                        endDateErrorT = false
                                    } else {
                                        setEndDateError("End date must be after the start date")
                                        setEndDate("");
                                    }

                                    //Check for all errors
                                    if (nameError !== "" || startDateError !== "" || endDateErrorT || startDate === "") {
                                        setNoErrors(false)
                                    } else setNoErrors(true)
                                }}></input>
                            <ErrorMessage errorMessage={endDateError} />
                        </div>
                    </div>
                </div>
                <div>
                    {!stateAdd && <div className={style.stateWrapper}><div className={`unselectable mb-1 ${style.stateDisplay}`} onClick={() => { setStateAdd(true) }}>
                        {props.phase.states.length <= 2 && <span className="p">{" + Add More States"}</span>}
                        {props.phase.states.length > 2 && <span className="p">{"Add state"}</span>}
                    </div></div>}
                    {stateAdd && <div className={`my-1 ${style.inlineState}`}>
                        <input className={`input ${style.nameD}`} value={newStateName} placeholder={"status name..."} autoFocus={true} onChange={e => { setNewStateName(String(e.target.value)); }}></input>
                        <button className={`ml-8 ${style.inlineButton}`} onClick={e => {
                            e.preventDefault();
                            NewState({
                                variables: {
                                    projectID: String(props.phase.id),
                                    state: newStateName,
                                },
                                refetchQueries: [{ query: getPhase, variables: { phaseID: phaseID } }]
                            });
                            setNewStateName("")
                            setStateAdd(false)
                        }}>{"Add"}</button>
                    </div>}
                    {(props.phase.states.length > 2 || stateAdd) && <div className={style.stateList}>
                        {props.phase.states.map(data => {
                            if (data === "todo" || data === "done") return (
                                <div className={style.stateListItem}>
                                    <p key={data} className="p ml-1 py-1 unselectable">{data}</p>
                                </div>
                            )
                            return (
                                <div className={style.stateListItem}>
                                    <p key={data} className="p ml-1 py-1 unselectable">{data}</p>
                                    <button className={`${style.userRemoveButton}`} onClick={e => {
                                        e.preventDefault()
                                        RemoveState({
                                            variables: {
                                                phaseID: phaseID,
                                                state: data
                                            },
                                            refetchQueries: [{ query: getPhase, variables: { phaseID: phaseID } }]
                                        })
                                    }}>{"x"}</button>
                                </div>
                            )
                        })}
                    </div>}
                </div>
                <div className={style.inlineB}>
                    {!props.phase.archived && <button className={`${edited && noErrors ? "buttonGreen" : "buttonInactive"}`} onClick={e => {
                        e.preventDefault();
                        UpdatePhase({
                            variables: {
                                phaseID: phaseID,
                                name: name,
                                startDate: startDate,
                                endDate: endDate
                            },
                            refetchQueries: [{ query: getPhase, variables: { phaseID: phaseID } }]
                        });
                        setEdited(false)
                    }}>{"Save"}</button>}
                    {!props.phase.archived && <button className="mt-2 button2" onClick={e => {
                        e.preventDefault();
                        ArchivePhase({
                            variables: {
                                phaseID: phaseID,
                                archived: true,
                            },
                            refetchQueries: [{ query: getPhases, variables: { projectID: projectID } }]
                        });
                        setEdited(false)
                    }}>{"Archive"}</button>}
                    {/*props.phase.id !== props.currentPhase && !props.phase.archived && <button className="mt-2 button2" onClick={e => {
                        e.preventDefault();
                        UpdateProject({
                            variables: {
                                projectID: String(props.project.project.id),
                                name: props.project.project.name,
                                description: props.project.project.description,
                                startDate: props.project.project.startDate,
                                endDate: props.project.project.endDate,
                                archived: false,
                                projectLeadID: props.project.project.projectLeadID,
                                projectMonitorID: props.project.project.projectMonitorID,
                                currentPhase: props.phase.id
                            },
                            refetchQueries: [
                                { query: getProject, variables: { projectID: String(props.project.project.id) } },
                                { query: getPhases, variables: { projectID: String(props.project.project.id) } }
                            ]
                        });
                    }}
                >{"Activate phase"}</button>*/}
                    {/*props.phase.id === props.currentPhase && <span className="mt-2 p" style={{ color: "var(--green)" }}>{"Currently active"}</span>*/}
                </div>
            </div>
        </div>
    )
}

export default PhaseEdit;