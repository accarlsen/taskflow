import React, { useState, useContext, useEffect, useRef } from 'react';
import { editTask, getAssignedTasks, getAuthorsTasks, setArchived, editSubtask, getSubtasksOfParent, setSubtaskArchived, getTasksInPhase } from '../../graphql/queries/tasks'
import { useMutation } from '@apollo/client'
import style from './editTask.module.css';
import UserOrgContext from '../context/userOrgContext';
import UserContext from '../context/userContext';
import AssigneeContext from '../context/assigneeContext';
import { useSpring, animated } from 'react-spring';
import SearchAssignee from '../createTask/components/searchAssignee';
import { getPhase, getProject } from '../../graphql/queries/project';

function EditTask(props) {
    //Context
    const dateNow = new Date().toISOString().substring(0, 10)
    const userID = useContext(UserContext)
    const orgID = useContext(UserOrgContext)
    const { assignedID, setAssignedID } = useContext(AssigneeContext)

    //States
    const [active, setActive] = useState(false);
    const [name, setName] = useState(props.subtask.name);
    const [weight, setWeight] = useState(props.subtask.weight)
    const [description, setDescription] = useState(props.subtask.description);
    const [deadlineTime, setDeadlineTime] = useState(props.subtask.deadlineTime)
    const [deadlineDate, setDeadlineDate] = useState(props.subtask.deadlineDate)
    const [weightActive, setWeightActive] = useState(false)

    //Rerender
    useEffect(() => {
        setName(props.subtask.name)
        setDeadlineTime(props.subtask.deadlineTime)
        //setAssignedID(props.subtask.assignedID)
        setDeadlineDate(props.subtask.deadlineDate)
    }, [props])

    //Queries
    const [EditTask, { errord }] = useMutation(editTask, {
        variables: { subtaskID: props.subtask.id, name, description, deadlineDate, deadlineTime, assignedID, weight, state: props.subtask.state }
    })

    const [EditSubtask, { errorb }] = useMutation(editSubtask, {
        variables: { subtaskID: props.subtask.id, name, description, deadlineDate, deadlineTime, assignedID, weight, state: props.subtask.state }
    })

    const [SetArchived, { errorf }] = useMutation(setArchived)

    const [SetSubArchived, { errora }] = useMutation(setSubtaskArchived)

    //Animations
    const spring = useSpring({ to: { opacity: active ? 1 : 0 } })
    //const searchSpring = useSpring({ config: { tension: 25, duration: 150 }, to: { opacity: searchActive ? 1 : 0 } })

    //Event-handlers
    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && (String(name.replace(/\s/g, '')).length >= 1)) {
            edit(event)
            setActive(false)
            setAssignedID("")
        }
        else if (event.key === 'Escape') {
            setActive(false)
            setAssignedID("")
        }
    }

    //Deselect dropdown when clikcing outside of it
    const wrapperRef = useRef(null);
    const useOutsideAlerter = (ref) => {
        useEffect(() => {
            /**
             * Alert if clicked on outside of element
             */
            function handleClickOutside(event) {
                if (ref.current && !ref.current.contains(event.target)) {
                    setWeightActive(false)
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

    //Functions
    const archive = (e) => {
        e.preventDefault()
        if (window.confirm("Archive the task?")) {
            if (props.projectID && props.subtaskBool) {
                SetSubArchived({
                    variables: {
                        subtaskID: props.subtask.id,
                        archived: true,
                    },
                    refetchQueries: [

                        { query: getAuthorsTasks, variables: { authorID: userID.userID, orgID: orgID.orgID, archived: false, period: 5 } },
                        { query: getAssignedTasks, variables: { assignedID: userID.userID, orgID: orgID.orgID, archived: false, period: 5 } },

                        { query: getTasksInPhase, skip: !props.subtask.phaseID, variables: { phaseID: props.subtask.phaseID } },
                        { query: getPhase, skip: !props.subtask.phaseID, variables: { phaseID: props.subtask.phaseID } },
                        { query: getProject, skip: !props.projectID, variables: { projectID: props.projectID } }

                    ]
                })
            } else if (props.subtaskBool) {
                SetSubArchived({
                    variables: {
                        subtaskID: props.subtask.id,
                        archived: true,
                    },
                    refetchQueries: [

                        { query: getAuthorsTasks, variables: { authorID: userID.userID, orgID: orgID.orgID, archived: false, period: 5 } },
                        { query: getAssignedTasks, variables: { assignedID: userID.userID, orgID: orgID.orgID, archived: false, period: 5 } },
                        { query: getSubtasksOfParent, variables: { taskID: props.subtask.parentID } },
                       
                    ]
                })
        } else if (props.projectID) {
                SetArchived({
                    variables: {
                        taskID: props.subtask.id,
                        archived: true,
                    },
                    refetchQueries: [
                        { query: getTasksInPhase, skip: !props.subtask.phaseID, variables: { phaseID: props.subtask.phaseID } },
                        { query: getPhase, skip: !props.subtask.phaseID, variables: { phaseID: props.subtask.phaseID } },
                        { query: getProject, skip: !props.projectID, variables: { projectID: props.projectID } }
                    ]
                })
            } else {
                SetArchived({
                    variables: {
                        taskID: props.subtask.id,
                        archived: true,
                    },
                    refetchQueries: [
                        { query: getAssignedTasks, skip: props.subtask.phaseID, variables: { assignedID: userID.userID, orgID: orgID.orgID, archived: false, period: 5 } },
                        { query: getAuthorsTasks, skip: props.subtask.phaseID, variables: { authorID: userID.userID, orgID: orgID.orgID, archived: false, period: 5 } },
                    ]
                })
            }
        }
    }

    const edit = (e) => {
        e.preventDefault();
        if (assignedID == "" || assignedID == undefined || assignedID == null) {
            //setAssignedID(props.subtask.assignedID)
        }
        let check = deadlineTime
        if (check != props.subtask.deadlineTime) {
            check = deadlineTime + ":00"
        }
        if (check.length < 6) {
            check = deadlineTime + ":00"
        }
        
        if (props.projectID && props.subtaskBool) {
            EditSubtask({
                variables: {
                    subtaskID: props.subtask.id,
                    name: name,
                    description: description,
                    deadlineTime: check,
                    deadlineDate: deadlineDate,
                    assignedID: assignedID,
                    weight: weight,
                    state: props.subtask.state
                },
                refetchQueries:
                    [
                        { query: getTasksInPhase, variables: { phaseID: props.subtask.phaseID } },
                        { query: getPhase, variables: { phaseID: props.subtask.phaseID } },
                        { query: getProject, variables: { projectID: props.projectID } }
                    ]
            })
        } else if (props.subtaskBool) {
            EditSubtask({
                variables: {
                    subtaskID: props.subtask.id,
                    name: name,
                    description: description,
                    deadlineTime: check,
                    deadlineDate: deadlineDate,
                    assignedID: assignedID,
                    weight: weight,
                    state: props.subtask.state
                },
                refetchQueries:
                    [
                        { query: getAssignedTasks, variables: { assignedID: userID.userID, orgID: orgID.orgID, archived: false, period: 5 } },
                        { query: getAuthorsTasks, variables: { authorID: userID.userID, orgID: orgID.orgID, archived: false, period: 5 } },

                    ]
            })
        } else if (props.projectID) {
            EditTask({
                variables: {
                    taskID: props.subtask.id,
                    name: name,
                    description: description,
                    deadlineTime: check,
                    deadlineDate: deadlineDate,
                    assignedID: assignedID,
                    weight: weight,
                    state: props.subtask.state
                },
                refetchQueries:
                    [
                        { query: getAssignedTasks, variables: { assignedID: userID.userID, orgID: orgID.orgID, archived: false, period: 5 } },
                        { query: getAuthorsTasks, variables: { authorID: userID.userID, orgID: orgID.orgID, archived: false, period: 5 } },

                        { query: getTasksInPhase, variables: { phaseID: props.subtask.phaseID } },
                        { query: getPhase, variables: { phaseID: props.subtask.phaseID } },
                        { query: getProject, variables: { projectID: props.projectID } }

                    ]
            })
        } else {
            EditTask({
                variables: {
                    taskID: props.subtask.id,
                    name: name,
                    description: description,
                    deadlineTime: check,
                    deadlineDate: deadlineDate,
                    assignedID: assignedID,
                    weight: weight,
                    state: props.subtask.state
                },
                refetchQueries:
                    [
                        { query: getAssignedTasks, variables: { assignedID: userID.userID, orgID: orgID.orgID, archived: false, period: 5 } },
                        { query: getAuthorsTasks, variables: { authorID: userID.userID, orgID: orgID.orgID, archived: false, period: 5 } },
                    ]
            })
        }
        setActive(false)
    }


    if (!active) return ( //default - retracted
        <button className={`${style.buttonEdit}`} onClick={() => { setActive(true); setAssignedID(props.subtask.assignedID) }}>
            <img className={`${style.elementIcon}`} src="https://www.materialui.co/materialIcons/editor/mode_edit_white_192x192.png"></img>
        </button>
    )

    return ( //else - expanded
        <div className={`${style.wrapper}`} onKeyDown={handleKeyDown}>
            <animated.div style={spring} className={style.grid}>
                <div className={style.innerWrapper}>
                    <div className={style.row1}>
                        <input className={`mt-1 mb-2 inputNoBorder ${style.name}`} autoFocus={true} value={name} placeholder={"task name..."} onChange={e => { setName(String(e.target.value)); }}></input>

                    </div>

                    <div className={`mt-2 ${style.row2}`}>
                        <div className={`${style.dlButton}`}>
                            {!props.subtaskBool && <input className={`${style.dlDate} inputNoBorder`} type="date" min={dateNow} value={deadlineDate} onChange={e => { setDeadlineDate(String(e.target.value)); }}></input>}
                            {props.subtaskBool && <input className={`${style.dlDate} inputNoBorder`} type="date" min={dateNow} max={props.parentDeadline} value={deadlineDate} onChange={e => {
                                if (e.target.value >= dateNow && e.target.value <= props.parentDeadline) setDeadlineDate(e.target.value);
                                else setDeadlineDate(deadlineDate)
                            }}></input>}
                        </div>
                        <div className={`${style.dlButton}`}>
                            <input className={`${style.dlTime} inputNoBorder`} type="time" value={deadlineTime} onChange={e => { setDeadlineTime(String(e.target.value)); }}></input>
                        </div>
                        <div>
                            {!props.subtask.subtaskAssignees && <SearchAssignee subtaskBool={props.subtaskBool} />}
                        </div>
                        {(props.subtaskBool || props.subtask.subtasks.length === 0) && <div ref={wrapperRef}>
                            <button className={style.dlButton} onClick={() => {
                                if (!weightActive) setWeightActive(true);
                                else setWeightActive(false)
                            }}>{`${weight === 0 || weight === null ? "+ Duration" : "Hours: " + weight}`}</button>
                            {weightActive && <div className={style.dlWrapper}>
                                <div className={style.weight}>
                                    <p className="p mt-1">{"Hours: "}</p>
                                    <input className={`inputNoBorder`} autoFocus={true} min={0} max={99} type="number" placeholder={weight} onChange={e => { if (Number(e.target.value) >= 0) setWeight(Number(e.target.value)); }}></input>
                                </div>
                            </div>}
                        </div>}
                    </div>
                </div>
                <div className="mt-2 mb-4">
                    <button className="buttonGreen" onClick={e => {
                        edit(e)
                        setActive(false)
                    }}>Update</button>
                    <button className="ml-3 buttonRed" onClick={e => {
                        archive(e)
                        setActive(false)
                    }}>Archive</button>
                    <button className="buttonCancel ml-3" onClick={() => {
                        setActive(false)
                    }}>Cancel</button>
                    {/*<textarea className={`input mt-3 ${style.description}`} value={description} placeholder={"description..."} onChange={e => { setDescription(String(e.target.value)); }}></textarea>*/}
                </div>
            </animated.div>
        </div>
    )
}

export default EditTask;