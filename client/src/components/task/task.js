import { useMutation } from '@apollo/client';
import React, { useState, useContext, useEffect } from 'react';
import { getPhase, getProject } from '../../graphql/queries/project';
import { setTaskState } from '../../graphql/queries/tasks';
import { getAssignedTasks } from '../../graphql/queries/tasks';
import { getAuthorsTasks, getTasksInPhase } from '../../graphql/queries/tasks'
import UserContext from '../context/userContext';
import UserOrgContext from '../context/userOrgContext';
import CreateSubtask from '../createSubtask/createSubtask';
import EditTask from '../editTask/editTask';
import SubTask from '../subtask/subtask';
import style from './task.module.css';
import jwt_decode from "jwt-decode";
import Cookies from 'universal-cookie';
import Fade from './../springs/fadeInOutTrans'

function Task(props) {
    const task = props.task;
    let show = props.showSubtasks

    //Contexts
    const userID = useContext(UserContext)
    const orgID = useContext(UserOrgContext)

    //States
    const [done, setDone] = useState(task.state)

    //Queries
    const [SetTaskState] = useMutation(setTaskState)

    //Cookies
    const cookies = new Cookies();
    let ownerCheck = cookies.get("accessToken")
    var decoded
    if (ownerCheck) decoded = jwt_decode(ownerCheck);

    useEffect(() => {
        setDone(task.state)
    }, [props])

    if (!props.showDone && task.state === "done") return <div></div>

    return (
        <div key={task.id} >
            <Fade show={true}>
                <div className={style.taskWrapper} >
                    <div className={style.task} >
                        <span className={`${task.subtasks.length === 0 ? style.doneButton : style.doneButtonDisplay}`} onClick={e => {
                            e.preventDefault();

                            if (task.subtasks.length === 0) {
                                let state = "todo"
                                if (task.state !== "done") {
                                    state = "done"
                                    setDone("done")
                                } else {
                                    setDone("todo")
                                }
                                if (props.phaseID && props.phaseID !== "" && props.projectID && props.projectID !== "") {
                                    SetTaskState({
                                        variables: {
                                            taskID: task.id,
                                            state: state
                                        },
                                        refetchQueries: [
                                            { query: getTasksInPhase, variables: { phaseID: props.phaseID } },
                                            { query: getPhase, variables: { phaseID: props.phaseID } },
                                            { query: getProject, variables: { projectID: props.projectID } }
                                        ]
                                    })
                                } else {
                                    SetTaskState({
                                        variables: {
                                            taskID: task.id,
                                            state: state
                                        },
                                        refetchQueries: [
                                            { query: getAuthorsTasks, variables: { authorID: userID.userID, orgID: orgID.orgID, archived: false, period: 5 } },
                                            { query: getAssignedTasks, variables: { assignedID: userID.userID, orgID: orgID.orgID, archived: false, period: 5 } },
                                        ]
                                    })
                                }
                            }
                        }}>
                            <Fade show={done === "done"}>
                                <svg className={style.doneCheckmark} viewBox="0 0 289 192" preserveAspectRatio="xMidYMid" width="289" height="192" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path stroke="#25D195" strokeWidth="35" d="M10.6066 61.3934L129.116 179.903M108.393 180.458L277.458 11.3934" />
                                </svg>
                            </Fade>
                        </span>
                        <p className={`p ${style.taskName}`}> {task.progress + "/" + task.weight + " - " + task.name} </p>
                        <p className={`p-grey ${style.date}`}>{task.deadlineTime !== "23:59:00" ? (task.deadlineTime.slice(0, 5) + " - " + task.deadlineDate.replaceAll("-", ".")) : (task.deadlineDate.replaceAll("-", "."))}</p>

                        {((task.authorID === userID.userID) || (decoded.admin === 1 || decoded.owner === 1)) && props.phaseID !== null && props.phaseID !== undefined && props.phaseID !== "" && <CreateSubtask parentDeadline={task.deadlineDate} taskID={task.id} tname={task.name} tdescription={task.description} time={task.deadlineTime} date={task.deadlineDate} archived={task.archived} assigned={task.assignedID} orgTag={false} phaseID={props.phaseID} projectID={props.projectID} />}
                        {task.authorID === userID.userID && !props.phaseID && (props.phaseID === null || props.phaseID === undefined || props.phaseID === "") && <CreateSubtask parentDeadline={task.deadlineDate} taskID={task.id} tname={task.name} tdescription={task.description} time={task.deadlineTime} date={task.deadlineDate} archived={task.archived} assigned={task.assignedID} />}
                        {((task.authorID === userID.userID) || (decoded.admin === 1 || decoded.owner === 1)) && <EditTask parentDeadline={task.deadlineDate} projectID={props.projectID} subtask={task} />}
                    </div>
                    {task.subtasks.length !== 0 &&
                        <div className={style.wrapperSubtask}>
                            {show && task.subtasks.slice().sort(function (a, b) {
                                if (a.state !== "done") {
                                    return -1;
                                }
                                if (a.state > b.state) {
                                    return 1;
                                }
                                return 0;
                            }).map((subtask, index) => {
                                if (props.phaseID && props.phaseID !== "" && props.projectID && props.projectID !== "") {
                                    return <Fade show={show} key={subtask.id}><SubTask key={subtask.id} parentDeadline={task.deadlineDate} subtask={subtask} showDone={props.showDone} phaseID={props.phaseID} projectID={props.projectID} orgTag={false} index={index} /></Fade>
                                } else {
                                    if (props.period !== null && props.period === 0 && subtask.state !== "done") {
                                        return <Fade show={show} key={subtask.id}><SubTask key={subtask.id} parentDeadline={task.deadlineDate} subtask={subtask} showDone={props.showDone} index={index} /></Fade>
                                    } else if (props.period === null) {
                                        return <Fade show={show} key={subtask.id}><SubTask key={subtask.id} parentDeadline={task.deadlineDate} subtask={subtask} showDone={props.showDone} index={index} /></Fade>
                                    } else if (props.period !== 0) {
                                        return <Fade show={show} key={subtask.id}><SubTask key={subtask.id} parentDeadline={task.deadlineDate} subtask={subtask} showDone={props.showDone} index={index} /></Fade>
                                    }
                                }
                            })}
                            {!show && <div>
                                <p className="p pl-4 py-2" style={{borderLeft: "2px solid var(--grey-light)", color: "var(--grey-dark)"}}>{task.subtasks.length + " Subtasks hidden"}</p>
                            </div>}
                        </div>
                    }
                </div>
            </Fade>
        </div>
    )
}

export default Task