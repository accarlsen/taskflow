import { useMutation, useQuery } from '@apollo/client';
import React, { useState } from 'react';
import {animated} from 'react-spring'
import { getSubtasksOfParent, getTasksInPhase, setSubtaskState, setTaskState } from '../../graphql/queries/tasks';
import style from './customNode.module.css';
import Fade from './../springs/fadeInOutTrans'


const TestComponent = ({data, dataTasks}) => {

    let task = data
    let tasks = dataTasks
    const [taskID] = useState(task.id)
    let state = ""
    let subtaskState = ""

    // Date logic
    const dateNow = new Date().toISOString().substring(0,10)
    const today = new Date()
    const tomorrowDate = new Date(today)
    tomorrowDate.setDate(tomorrowDate.getDate() + 1)
    //const newTomorrow = tomorrowDate.toISOString().substring(0,10)


    const [SetTaskState] = useMutation(setTaskState, {
        variables: {},
        refetchQueries:[
          { query: getTasksInPhase, variables:{phaseID: task.phaseID}},
          { query: getSubtasksOfParent, variables:{taskID: task.id}}
        ]
    })

    const [SetSubtaskState] = useMutation(setSubtaskState, {
      variables: {}, 
      refetchQueries:[
        { query: getTasksInPhase, variables:{phaseID: task.phaseID}},
        { query: getSubtasksOfParent, variables:{taskID: task.id}},
      ]
    })

    const {data:dataS} = useQuery(getSubtasksOfParent, {
      variables:{taskID: taskID}
    })

    var dateOk = true
    var overdue = true

    if(task.deadlineDate < dateNow) {
      dateOk = false
    }

    if(dateOk) {
      overdue = false
    }

    let prevTaskDone = false
    let inParallell = false
    let prevTasksArr = []
    let targetPrevTasks = []
    for(let i = 0; i < tasks?.length; i++) {
      for(let j = 0; j < tasks[i]?.nextTasks?.length; j++) {
        if(tasks[i].nextTasks[j] === task.id) {
          prevTasksArr.push(tasks[i])
          if(tasks[i].state === "done") {
            prevTaskDone = true
          } 
        }
        if(task?.nextTasks !== undefined && task?.nextTasks !== null) {
          if(tasks[i]?.nextTasks[j]?.includes(task?.nextTasks[j])) {
            targetPrevTasks?.push(tasks[i]?.state)
          }
        }
      }
    }

    for(let i = 0; i < prevTasksArr?.length; i++) {
      if(prevTasksArr[i].state !== "done") {
        prevTaskDone = false
      }
    }
    
    return(
      <Fade show={true}>
        <div className={`${style.taskWrapper}`} style={task.state === "done" ? {borderTop: "7.5px solid var(--green)"} : !prevTaskDone && prevTasksArr.length !== 0  ? {borderTop:"7.5px solid grey"} : overdue ? {borderTop:"7.5px solid var(--red)"} : {borderTop:"7.5px solid orange"}}>
          {dataS ? 
          <div className={`${task.subtasks.length === 0 ? style.task1 : style.task1Sub}`} style={dataS.subtasksOfParent !== null || dataS.subtasksOfParent !== undefined ? {borderBottom:'1px solid grey'} : {}}>
            {task.subtasks.length === 0 && <span className={style.doneButton} onClick={e => {
                if(prevTasksArr.length !== 0) {
                  if(!prevTaskDone) {
                    return
                  }
                }
                console.log(targetPrevTasks)
                console.log("Name:", task.name, " inpara:", inParallell)
                if(task.state === undefined || task.state === null || task.state==="" || task.state==="doing" || task.state==="todo") state = "done"
                SetTaskState({
                    variables : {
                        taskID: task.id,
                        state: state,
                        tasksInPara: targetPrevTasks,
                    },
                    refetchQueries:[
                      { query: getTasksInPhase, variables:{phaseID: task.phaseID}},
                      { query: getSubtasksOfParent, variables:{taskID: task.id}},
                    ]
                }
                )
                }}>
                <Fade show={task.state === "done"}>
                  <svg className={style.doneCheckmark} viewBox="0 0 289 192" preserveAspectRatio="xMidYMid" width="289" height="192" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path stroke="#25D195" strokeWidth="40" d="M10.6066 61.3934L129.116 179.903M108.393 180.458L277.458 11.3934" />
                  </svg>
                </Fade>
              </span>}
              {task.state === "done" ? <p className={`p ${style.taskNameDone}`}>{task.name + " - " + task.progress + "/" + task.weight}</p> : <p className={`p ${style.taskName}`}>{task.name  + " - " + task.progress + "/" + task.weight}</p>}
          </div>
          : ''}
          {dataS ? 
            <div className={style.subtaskPreWrapper}>
            {dataS.subtasksOfParent != null || dataS.subtasksOfParent != undefined ?
            <div className={`mt-2 ${style.subtaskWrapper}`}>
              {dataS.subtasksOfParent.slice().sort((a, b) => {
                    if (a.state !== "done") {
                        return -1;
                    }
                    if (a.state > b.state) {
                        return 1;
                    }
                    return 0;
                }).map(subtask => (
                  <div className={style.subTask} key={subtask.id} style={subtask.state==="done" ? {borderLeft:"2px solid var(--green)"} : !prevTaskDone && prevTasksArr.length !== 0 ? {borderLeft:"2px solid var(--grey)"} : overdue ? {borderLeft:"2px solid var(--red)"} : {borderLeft:"2px solid var(--yellow)"}}>
                    <span className={style.doneButton} onClick={e => {
                        e.preventDefault(); //
                        if(prevTasksArr.length !== 0) {
                          if(!prevTaskDone) {
                            return
                          }
                        }
                        if(subtask.state === undefined || subtask.state === null || subtask.state === "" || subtask.state === "doing" || subtask.state === "todo") subtaskState = "done"
                        SetSubtaskState({
                            variables : {
                                subtaskID: subtask.id,
                                state: subtaskState,
                                tasksInPara: targetPrevTasks
                            },
                            refetchQueries:[
                              { query: getTasksInPhase, variables:{phaseID: task.phaseID}},
                              { query: getSubtasksOfParent, variables:{taskID: task.id}},
                            ]
                        }
                        )
                        }}>
                        <Fade show={subtask.state === "done"}>
                          <svg className={style.doneCheckmark} viewBox="0 0 289 192" preserveAspectRatio="xMidYMid" width="289" height="192" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path stroke="#25D195" strokeWidth="40" d="M10.6066 61.3934L129.116 179.903M108.393 180.458L277.458 11.3934" />
                          </svg>
                        </Fade>
                      </span>
                      {subtask.state === "done" ? <p className={`p ${style.taskNameDone}`}>{subtask.name}</p> : <p className={`p ${style.taskName}`}>{subtask.name}</p>}
                      <div className={style.borderSubtask} style={{borderBottom: '1px solid grey'}}></div>
                  </div>
              )
              )}
            </div>
            :''}
          </div>
          : ''}
        </div>
      </Fade>
    )
  }

export default TestComponent