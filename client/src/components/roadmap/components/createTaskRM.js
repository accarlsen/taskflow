import { useMutation } from '@apollo/client';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { getAssignedTasks, getAuthorsTasks, getTasksInPhase, newTaskOrg, newTaskPhase } from '../../../graphql/queries/tasks';
import AssigneeContext from '../../context/assigneeContext';
import UserContext from '../../context/userContext';
import UserOrgContext from '../../context/userOrgContext';
import style from './createTaskRM.module.css';
import { useSpring, animated } from 'react-spring'
import { getPhase, getProject } from '../../../graphql/queries/project';
import SearchAssignee from '../../createTask/components/searchAssignee';

function CreateTaskRM(props) {

    //Context etc.
    const dateNow = new Date().toISOString().substring(0, 10)
    const orgTag = props.orgTag
    const phaseID = props.phaseID
    const userID = useContext(UserContext)
    const orgID = useContext(UserOrgContext)

    //States
    const { assignedID, setAssignedID } = useContext(AssigneeContext)
    const [active, setActive] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [weight, setWeight] = useState(0)
    const [deadlineTime, setDeadlineTime] = useState("23:59");
    const [deadlineDate, setDeadlineDate] = useState(dateNow);
    const [weightActive, setWeightActive] = useState(false)

    //Queries
    const [NewTaskOrg, { error }] = useMutation(newTaskOrg, {
        variables: { name, description, weight, deadlineDate, deadlineTime, assignedID, orgID }
    })

    const [NewTaskPhase] = useMutation(newTaskPhase, {
        variables: { name, description, weight, deadlineDate, deadlineTime, assignedID, orgID, phaseID }
    })

    const spring = useSpring({ to: { opacity: active ? 1 : 0 } })

    if (error) {
        console.log(error.message);
    }

    //Event-handlers
    let shift = false
    const handleKeyDown = (event) => {
        if (shift && event.key === 'Enter' && (String(name.replace(/\s/g, '')).length >= 1)) {
            createTask(event)
            setName("")
        }
        else if (event.key === 'Enter' && (String(name.replace(/\s/g, '')).length >= 1)) {
            createTask(event)
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

    //Functions
    const createTask = (e) => {
        e.preventDefault();
        let checkedAssignedID = assignedID
        if (checkedAssignedID == undefined || checkedAssignedID == null || checkedAssignedID == "") {
            checkedAssignedID = userID.userID
        }
        if (weight === undefined || weight === null) {
            setWeight(0)
        }
        if (!orgTag) {
            NewTaskPhase({
                variables: {
                    name: name,
                    description: description,
                    deadlineTime: deadlineTime + ":00",
                    deadlineDate: deadlineDate,
                    assignedID: checkedAssignedID,
                    orgID: orgID.orgID,
                    authorID: userID.userID,
                    weight: weight,
                    phaseID: phaseID
                },
                refetchQueries: [
                    { query: getTasksInPhase, variables: { phaseID: phaseID } },
                    { query: getPhase, variables: { phaseID: phaseID } },
                    { query: getProject, variables: { projectID: props.projectID } }
                ]
            });
        }
        else {
            NewTaskOrg({
                variables: {
                    name: name,
                    description: description,
                    deadlineTime: deadlineTime + ":00",
                    deadlineDate: deadlineDate,
                    assignedID: checkedAssignedID,
                    orgID: orgID.orgID,
                    authorID: userID.userID,
                    weight: weight
                },
                refetchQueries: [
                    { query: getAuthorsTasks, variables: { authorID: userID.userID, orgID: orgID.orgID, archived: false, period: 0 } },
                    { query: getAuthorsTasks, variables: { authorID: userID.userID, orgID: orgID.orgID, archived: false, period: 1 } },
                    { query: getAuthorsTasks, variables: { authorID: userID.userID, orgID: orgID.orgID, archived: false, period: 2 } },
                    { query: getAuthorsTasks, variables: { authorID: userID.userID, orgID: orgID.orgID, archived: false, period: 3 } },
                    { query: getAssignedTasks, variables: { assignedID: userID.userID, orgID: orgID.orgID, archived: false, period: 5 } }
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
    if (!active) return ( //default - retracted
        <div className={`${style.wrapperPre}`} >
            <button className="buttonGreen" onClick={() => setActive(true)}>+ Add Task</button>
        </div>
    )
    return (
        <animated.div style={spring} className={`${style.wrapper} ma`} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
            <div className={style.innerWrapper}>
                <div className={style.row1}>
                    <textarea className={`mt-1 mb-2 inputNoBorder ${style.description}`} autoFocus={true} value={name} placeholder={"task name..."} onChange={e => { setName(String(e.target.value)); }}></textarea>
                </div>

                <div className={`mt-2 ${style.row2}`}>
                    <div className={`${style.dlButton}`}>
                        {(!props.phaseStartDate || !props.phaseEndDate) && <input className={`${style.dlDate} inputNoBorder`} type="date" value={deadlineDate} onChange={e => {
                            if (e.target.value >= dateNow) setDeadlineDate(e.target.value);
                            else setDeadlineDate(deadlineDate)
                        }}></input>}
                        {props.phaseStartDate && props.phaseEndDate && <input className={`${style.dlDate} inputNoBorder`} type="date" min={dateNow > props.phaseStartDate ? dateNow : props.phaseStartDate} max={props.phaseEndDate} value={deadlineDate} onChange={e => {
                            if (e.target.value >= dateNow && e.target.value >= props.phaseStartDate && e.target.value <= props.phaseEndDate) setDeadlineDate(e.target.value);
                            else setDeadlineDate(deadlineDate)
                        }}></input>}
                    </div>
                    <div className={`${style.dlButton}`}>
                        <input className={`${style.dlTime} inputNoBorder`} type="time" value={deadlineTime} onChange={e => { setDeadlineTime(String(e.target.value)); }}></input>
                    </div>
                </div>
                <div className={`mt-1 ${style.row2}`}>
                    <div className={style.fit}>
                        <SearchAssignee />
                    </div>
                    <div ref={wrapperRef} className={style.fit}>
                        <button className={style.dlButton} onClick={() => {
                            if (!weightActive) setWeightActive(true);
                            else setWeightActive(false)
                        }}>{`${weight === 0 || weight === null ? "+ Duration" : "Hours: " + weight}`}</button>
                        {weightActive && <div className={style.dlWrapper}>
                            <div className={style.weight}>
                                <p className="p mt-1">{"Hours: "}</p>
                                <input className={`inputNoBorder`} autoFocus={true} min={0} max={99} type="number" placeholder={"0"} onChange={e => { if (Number(e.target.value) >= 0) setWeight(Number(e.target.value)); }}></input>
                            </div>
                        </div>}
                    </div>
                </div>
            </div>
            <div className="mt-2 mb-4">
                <button className={`${String(name.replace(/\s/g, '')).length >= 1 ? "buttonGreen" : "buttonInactive"}`} onClick={e => {
                    if (String(name.replace(/\s/g, '')).length >= 1) {
                        createTask(e)
                        cancel()
                    }
                }}>Create</button>

                <button className="buttonCancel ml-4" onClick={() => { cancel() }}>Cancel</button>
                {/*<textarea className={`input mt-3 ${style.description}`} value={description} placeholder={"description..."} onChange={e => { setDescription(String(e.target.value)); }}></textarea>*/}
            </div>
        </animated.div>
    )
}

export default CreateTaskRM;