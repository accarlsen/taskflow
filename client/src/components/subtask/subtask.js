import { useMutation } from '@apollo/client';
import React, { useState, useContext, useEffect } from 'react';
import { getPhase, getProject } from '../../graphql/queries/project';
import { getAssignedTasks } from '../../graphql/queries/tasks';
import { getAuthorsTasks, setSubtaskState, getTasksInPhase } from '../../graphql/queries/tasks'
import UserContext from '../context/userContext';
import UserOrgContext from '../context/userOrgContext';
import EditTask from '../editTask/editTask';
import jwt_decode from "jwt-decode";
import Cookies from 'universal-cookie';
import style from './subtask.module.css';
import Fade from './../springs/fadeInOutTrans'

function SubTask(props) {
    const subtask = props.subtask;

    //Cookies
    const cookies = new Cookies();
    let ownerCheck = cookies.get("accessToken")
    var decoded 
    if(ownerCheck) decoded= jwt_decode(ownerCheck);

    //Contexts
    const userID = useContext(UserContext)
    const orgID = useContext(UserOrgContext)

    //States
    const [done, setDone] = useState(subtask.state)

    //Queries
    const [SetSubtaskState] = useMutation(setSubtaskState)

    useEffect(() => {

    }, [done])

    if (!props.showDone && subtask.state === "done") return <div></div>
    
    return (
        <div className={style.subtaskWrapper} key={subtask.id} style={done === "done" ? { borderLeft: "2px solid var(--green)" } : { borderLeft: "2px solid var(--grey-light)" }}>
            <div className={style.subtask} >
                <span className={style.doneButton} onClick={e => {
                    e.preventDefault();
                    let subtaskState = "todo"
                    if (subtask.state !== "done") {
                        subtaskState = "done"
                        setDone("done")
                    } else {
                        setDone("todo")
                    }
                    if (props.phaseID && props.phaseID !== "" && props.projectID && props.projectID !== "") {
                        SetSubtaskState({
                            variables: {
                                subtaskID: subtask.id,
                                state: subtaskState
                            },
                            refetchQueries: [
                                { query: getTasksInPhase, variables: { phaseID: props.phaseID } },
                                { query: getPhase, variables: { phaseID: props.phaseID } },
                                { query: getProject, variables: { projectID: props.projectID } }
                            ]
                        })
                    } else {
                        SetSubtaskState({
                            variables: {
                                subtaskID: subtask.id,
                                state: subtaskState
                            },
                            refetchQueries: [
                                { query: getAuthorsTasks, variables: { authorID: userID.userID, orgID: orgID.orgID, archived: false, period: 5 } },
                                { query: getAssignedTasks, variables: { assignedID: userID.userID, orgID: orgID.orgID, archived: false, period: 5 } },
                            ]
                        })
                    }
                }}>
                    <Fade show={done === "done"}>
                        <svg className={style.doneCheckmark} viewBox="0 0 289 192" preserveAspectRatio="xMidYMid" width="289" height="192" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path stroke="#25D195" strokeWidth="35" d="M10.6066 61.3934L129.116 179.903M108.393 180.458L277.458 11.3934" />
                        </svg>
                    </Fade>
                </span>
                <p className={`p ${style.taskName}`}> {subtask.progress + "/" + subtask.weight + " - " + subtask.name} </p>
                    <p className={`p-grey ${style.date}`}>{subtask.deadlineTime !== "23:59:00" ? (subtask.deadlineTime.slice(0,5) + " - " + subtask.deadlineDate.replaceAll("-", ".")) : (subtask.deadlineDate.replaceAll("-", "."))}</p>

                {((subtask.authorID === userID.userID) || (decoded.admin === 1 || decoded.owner === 1)) && <EditTask parentDeadline={props.parentDeadline} projectID={props.projectID} subtask={subtask} subtaskBool={true} />}
            </div>
        </div>
    )
}

export default SubTask