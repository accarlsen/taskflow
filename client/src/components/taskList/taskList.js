import React, { useState, useEffect } from 'react';
import style from './taskList.module.css';
import Task from '../task/task';

function TaskList(props) {

    const data = props.data


    const [showSubtasks, setShowSubtasks] = useState(localStorage.getItem("showSubtasks") !== null ? localStorage.getItem("showSubtasks") : true)
    const [showDone, setShowDone] = useState(localStorage.getItem("showCompleted") !== null ? localStorage.getItem("showCompleted") : true)

    // Date logic
    const today = new Date()
    const tomorrowDate = new Date(today)
    tomorrowDate.setDate(tomorrowDate.getDate() + 1)

    useEffect(() => { //Re-render upon input change
    }, [props])

    //Render
    if (data) {
        let subtaskCheck = false
        for (let i = 0; i < data.length; i++) {
            if (data[i].subtasks.length !== 0) {
                subtaskCheck = true
                break
            }
        }
        return (
            <div className={style.wrapper}>
                <div className={style.filterWrapper}>
                    <div>
                        {subtaskCheck &&
                            <button className={`my-1 ${style.filterButton}`} onClick={() => {
                                if (showSubtasks) {
                                    setShowSubtasks(false);
                                    localStorage.setItem("showSubtasks", false)
                                }
                                else {
                                    setShowSubtasks(true)
                                    localStorage.setItem("showSubtasks", true)
                                }
                            }}
                            >{showSubtasks ? "Hide subtasks" : "Show subtasks"}</button>}
                        {data.length !== 0 &&
                            <button className={`my-1 ${style.filterButton}`} onClick={() => {
                                if (showDone) {
                                    setShowDone(false);
                                    localStorage.setItem("showCompleted", false)
                                }
                                else {
                                    setShowDone(true)
                                    localStorage.setItem("showCompleted", true)
                                }

                            }}>{showDone ? "Hide completed" : "Show completed"}</button>}
                    </div>
                </div>
                {data.slice().sort((a, b) => {
                    if (a.state !== "done") {
                        return -1;
                    }
                    if (a.state > b.state) {
                        return 1;
                    }
                    return 0;
                }).map(task => {
                    if (props.phaseID && props.phaseID !== "" && props.projectID && props.projectID !== "") {
                        return <Task key={task.id} task={task} showSubtasks={showSubtasks} showDone={showDone} phaseID={props.phaseID} projectID={props.projectID} />
                    }
                    else {
                        if (props.period === 0 && task.state !== "done") {
                            return <Task key={task.id} task={task} showSubtasks={showSubtasks} showDone={showDone} period={props.period} />
                        } else if (props.period !== 0) {
                            return <Task key={task.id} task={task} showSubtasks={showSubtasks} showDone={showDone} period={props.period} />
                        }
                    }
                })}
            </div>
        )
    }
    return (<div></div>)
}


export default TaskList;