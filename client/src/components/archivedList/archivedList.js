import {useSpring, animated} from 'react-spring'
import React, { useContext, useState } from 'react'
import UserContext from '../context/userContext'
import EditTask from '../editTask/editTask'
import style from './../taskList/taskList.module.css'

function ArchivedList(props) {
    const data = props.tasks
    const subtasks = props.subtasks
    const userID = useContext(UserContext)
    const [showSubtasks, setshowSubtasks] = useState(false)
    const spring = useSpring({to: {opacity: showSubtasks ? 1 : 0}})

    console.log(data)
    console.log(subtasks)

    if(data) {
        let subtaskCheck = false
        for(let i = 0; i < data.tasksByAuthor.length; i++) {
            if(data.tasksByAuthor[i].subtasks.length !== 0) {
                subtaskCheck = true
                break
            }
        }
        return(
            <div className={style.wrapperWrapper}>
                <h4 className={`ma mb-4 mt-2 ${style.title}`}>Archived
                {subtaskCheck && 
                    <button className={`ml-10 ${style.buttonShowSub}`} onClick={(e) => {
                        e.preventDefault()
                        if(showSubtasks === false) {
                            setshowSubtasks(true)
                        } else {
                            setshowSubtasks(false)
                        }
                    }}>{showSubtasks ? "Hide Subtasks" : "Show Subtasks"}</button>}
                </h4>
                <div className={style.topBorder} style={showSubtasks ? {borderBottom: "0px grey solid"} : {borderBottom:"1px var(--grey) solid"}}></div>
                {data?.tasksByAuthor?.map(task => (
                <div key={task.id}>
                    <div className={style.wrapper}>
                        <div className={style.taskWrapper} style={showSubtasks ? {borderTop:"1px var(--grey) solid"} : {}} >
                            <div className={style.task} >
                                <span className={style.doneButton} >
                                    {task.state === "done" && <svg className={style.doneCheckmark} viewBox="0 0 289 192" preserveAspectRatio="xMidYMid" width="289" height="192" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path stroke="#25D195" strokeWidth="40" d="M10.6066 61.3934L129.116 179.903M108.393 180.458L277.458 11.3934" />
                                    </svg>}
                                </span>
                                <p className={`p ${style.taskName}`}>
                                    {task.name}
                                </p>
                                {task.authorID === userID.userID ? <EditTask taskID={task.id}  tname={task.name} tdescription={task.description} time={task.deadlineTime} date={task.deadlineDate} archived={task.archived} assigned={task.assignedID}/> : ''}
                            </div>
                        </div>
                    </div>
                    <animated.div style={spring}>
                        {task.subtasks.length !== 0 ? 
                            <div>
                            {showSubtasks ? 
                            <div className={style.wrapperSubtask}> 
                                {task?.subtasks?.map(subtask => (
                                    <div className={style.subtaskWrapper} key={subtask.id} >
                                        <div className={style.subtask} >
                                            <span className={style.doneButton} >
                                                {subtask.state === "done" && 
                                                <svg className={style.doneCheckmark} viewBox="0 0 289 192" preserveAspectRatio="xMidYMid" width="289" height="192" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path stroke="#25D195" strokeWidth="40" d="M10.6066 61.3934L129.116 179.903M108.393 180.458L277.458 11.3934" />
                                                </svg>}
                                            </span>
                                            <p className={`p ${style.taskName}`}>
                                                {subtask.name}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            : ''}
                            </div>
                        : ''}
                    </animated.div>
                </div>
            ))}
            <div>
                {subtasks?.subtasksByAuthor && subtasks?.length !== 0 ?
                <div>
                    <p className="p ma mt-4 mb-4">Subtasks - Parent not archived:</p>
                    {subtasks?.subtasksByAuthor?.map(subtask => (
                        <div className={`${style.wrapper}`} key={subtask.id} style={{borderTop:"1px solid grey"}}>
                            <div className={style.taskWrapper}>
                                <div className={style.task}>
                                <span className={style.doneButton} >
                                    {subtask.state === "done" && <svg className={style.doneCheckmark} viewBox="0 0 289 192" preserveAspectRatio="xMidYMid" width="289" height="192" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path stroke="#25D195" strokeWidth="40" d="M10.6066 61.3934L129.116 179.903M108.393 180.458L277.458 11.3934" />
                                    </svg>}
                                </span>
                                <p className={`p ${style.taskName}`}>
                                    {subtask.name}
                                </p>
                                {subtask.authorID === userID.userID ? <EditTask taskID={subtask.id}  tname={subtask.name} tdescription={subtask.description} time={subtask.deadlineTime} date={subtask.deadlineDate} archived={subtask.archived} assigned={subtask.assignedID}/> : ''}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                :
                <div className={``}>
                    {data.tasksByAuthor && <h4 className={`p ma mt-4 mb-4`}>{"No Archived Tasks"}</h4>}
                    <h4 className={`p ma mt-4 mb-4`}>{"No Archived Subtasks"}</h4>
                </div>
            }
            </div>
        </div>
        )
    } else {
        return (
            <div className={style.wrapperWrapper}>
                <h4 className="ma mt-2">No tasks</h4>
            </div>
        )
    }
}

export default ArchivedList