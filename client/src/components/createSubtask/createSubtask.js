import { useMutation } from '@apollo/client';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { createSubtask, getAuthorsTasks, getSubtasksOfParent, getTasksInPhase } from '../../graphql/queries/tasks';
import AssigneeContext from '../context/assigneeContext';
import UserContext from '../context/userContext';
import UserOrgContext from '../context/userOrgContext';
import SearchAssignee from '../createTask/components/searchAssignee';
import style from './createSubtask.module.css';
import { useSpring, animated } from 'react-spring'
import { getPhase, getProject } from '../../graphql/queries/project';

function CreateSubtask(props) {
    const dateNow = new Date().toISOString().substring(0, 10)
    const phaseID = props.phaseID
    const parentID = props.taskID

    //Contexts
    const userID = useContext(UserContext)
    const orgID = useContext(UserOrgContext)
    const { assignedID, setAssignedID } = useContext(AssigneeContext)

    //States
    const [active, setActive] = useState(false);
    const [name, setName] = useState("");
    const [description] = useState("");
    const [weight, setWeight] = useState(0)
    const [deadlineTime, setDeadlineTime] = useState("23:59");
    const [deadlineDate, setDeadlineDate] = useState(dateNow);
    const [weightActive, setWeightActive] = useState(false)

    //Event-handlers
    let shift = false
    const handleKeyDown = (event) => {
        if (shift && event.key === 'Enter' && String(name.replace(/\s/g, '')).length >= 1) {
            createSubtaskEvent(event)
            setName("")
        }
        else if (event.key === 'Enter' && String(name.replace(/\s/g, '')).length >= 1) {
            createSubtaskEvent(event)
            cancel()
        }
        else if (event.key === 'Shift') {
            shift = true
        }
        else if (event.key === 'Escape') {
            cancel()
        }
    }

    const handleKeyUp = (event) => {
        if (event.key === 'Shift') {
            shift = false
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


    //Queries
    const [CreateSubtask, { error }] = useMutation(createSubtask, {
        variables: { taskID: parentID, name, description, weight, deadlineDate, deadlineTime, assignedID, orgID, parentID }
    })

    const createSubtaskEvent = (e) => {
        e.preventDefault();
        let check = assignedID
        if (check === undefined || check === null || check === "") {
            check = userID.userID
        }
        if (weight === undefined || weight === null) {
            setWeight(0)
        }
        console.log("In create, assigned: ", check)
        if (props.phaseID && props.phaseID !== "" && props.projectID && props.projectID !== "") {
            CreateSubtask({
                variables: {
                    parentID: parentID,
                    name: name,
                    description: description,
                    deadlineTime: deadlineTime + ":00",
                    deadlineDate: deadlineDate,
                    assignedID: check,
                    orgID: orgID.orgID,
                    authorID: userID.userID,
                    weight: weight,
                    phaseID: phaseID
                },
                refetchQueries: [
                    { query: getTasksInPhase, variables: { phaseID: phaseID } },
                    { query: getPhase, variables: { phaseID: props.phaseID } },
                    { query: getProject, variables: { projectID: props.projectID } }
                ]
            });
        }
        else {
            CreateSubtask({
                variables: {
                    parentID: parentID,
                    name: name,
                    description: description,
                    deadlineTime: deadlineTime + ":00",
                    deadlineDate: deadlineDate,
                    assignedID: check,
                    orgID: orgID.orgID,
                    authorID: userID.userID,
                    weight: weight,
                },
                refetchQueries: [
                    { query: getSubtasksOfParent, variables: { taskID: parentID } },
                    { query: getAuthorsTasks, variables: { authorID: userID.userID, orgID: orgID.orgID, archived: false, period: 5 } },
                ]
            });
        }
    }

    const cancel = () => {
        setActive(false)
        setAssignedID("")
        setName("")
        setWeight(0)
        setDeadlineTime("23:59")
        setDeadlineDate(dateNow)
    }


    //Render
    if (error) console.log(error.message)
    const spring = useSpring({ to: { opacity: active ? 1 : 0 } })

    if (error) {
        console.log(error.message);
    }

    if (!active) return ( //default - retracted
        <div className={`${style.wrapperPre}`} >
            <button className={`${style.buttonSub}`} onClick={() => setActive(true)}>+</button>
        </div>
    )
    return (
        <animated.div style={spring} className={`${style.wrapper}`} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
            <div className={style.grid}>
                <div className={style.innerWrapper}>
                    <div className={style.row1}>
                        <input className={`mt-1 mb-2 inputNoBorder ${style.name}`} autoFocus={true} value={name} placeholder={"subtask name..."} onChange={e => { setName(String(e.target.value)); }}></input>

                    </div>

                    <div className={`mt-2 ${style.row2}`}>
                        <div className={`${style.dlButton}`}>
                            <input className={`${style.dlDate} inputNoBorder`} type="date" min={dateNow} max={props.parentDeadline} value={deadlineDate} onChange={e => {
                                if (e.target.value >= dateNow || e.target.value <= props.parentDeadline) setDeadlineDate(e.target.value);
                                else setDeadlineDate(deadlineDate)
                            }}></input>
                        </div>
                        <div className={`${style.dlButton}`}>
                            <input className={`${style.dlTime} inputNoBorder`} type="time" value={deadlineTime} onChange={e => { setDeadlineTime(String(e.target.value)); }}></input>
                        </div>
                        <div>
                            <SearchAssignee subtaskBool={true}/>
                        </div>
                        
                        <div ref={wrapperRef}>
                            <button className={style.dlButton} onClick={() => {
                                if (!weightActive) setWeightActive(true);
                                else setWeightActive(false)
                            }}>{`${weight === 0 || weight === null ? "+ Duration" : "Hours: " + weight}`}</button>
                            {weightActive && <div className={style.dlWrapper}>
                                <div className={style.weight}>
                                    <p className="p mt-1">{"Hours: "}</p>
                                    <input className={`inputNoBorder`} autoFocus={true} min={0} max={99} type="number"  placeholder={"0"} onChange={e => { if(Number(e.target.value) > 0) setWeight(Number(e.target.value)); }}></input>
                                </div>
                            </div>}
                        </div>
                    </div>
                </div>
                <div className="mt-2 mb-4">
                    <button className={`${String(name.replace(/\s/g, '')).length >= 1 ? "buttonGreen" : "buttonInactive"}`} onClick={e => {
                        if (String(name.replace(/\s/g, '')).length >= 1) {
                            createSubtaskEvent(e)
                            cancel()
                        }
                    }}>Create</button>
                    <button className="buttonCancel ml-4" onClick={() => {
                        cancel()
                    }}>Cancel</button>
                    {/*<textarea className={`input mt-3 ${style.description}`} value={description} placeholder={"description..."} onChange={e => { setDescription(String(e.target.value)); }}></textarea>*/}
                </div>
            </div>
        </animated.div>
    )
}

export default CreateSubtask;
