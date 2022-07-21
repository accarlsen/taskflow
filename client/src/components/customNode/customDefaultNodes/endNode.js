import React from 'react';
import style from './endNode.module.css';
import Fade from './../../springs/fadeInOutTrans'

const EndNode = (props) => {
    let prevTaskDone = true
    const prevTaskState = props.state
    const tasks = props.tasks
    for(var i =0;i<tasks.length; i++){
        if(tasks[i].state!=='done'){
            prevTaskDone=false
            break
        } 
    }

    return(
        <div className={` ${style.wrapper}`} style={prevTaskDone ? {border:"5px dashed var(--green)"} : {border:"5px dashed grey"}}>
            <p className ={`p ${style.text}`} style={prevTaskDone ? {borderBottom: "3px dashed var(--green)"} : {borderBottom: "3px dashed grey"}}>
                {prevTaskDone  && 
                    <svg className={style.doneCheckmark} viewBox="0 0 289 192" preserveAspectRatio="xMidYMid" width="289" height="192" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path stroke="#25D195" strokeWidth="40" d="M10.6066 61.3934L129.116 179.903M108.393 180.458L277.458 11.3934" />
                    </svg>
                }
                {prevTaskDone ? props.text : props.text2}
            </p>
        </div>
    )
}

export default EndNode