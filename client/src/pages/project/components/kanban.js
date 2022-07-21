import { useQuery } from '@apollo/client';
import React, { useState } from 'react';
import { getPhases } from '../../../graphql/queries/project';
import {DragDropContext, DropTarget, DragSource, DndProvider} from 'react-dnd'
import {HTML5Backend} from 'react-dnd-html5-backend'
import style from './../project.module.css';


function Kanban(props) {

    //States & Context
    const [tasks, setTasks] = useState(props.tasksInPhase)
    console.log(props.tasksInPhase)
    console.log(tasks)

    //Methods
    const update = (id, state) => {
        const tasksC = tasks;
        console.log(tasksC)
        let task =  Object.assign({}, tasksC.find((task) => task.id === id))
        console.log(task)
        task.state = state
        const taskIndex = tasksC.indexOf(task)
        const newTasks = update(tasksC, {
            [taskIndex]: {$set: task},
        })
        console.log(newTasks)
        setTasks(newTasks)
    }

    //Render
    return (
        <DndProvider backend={HTML5Backend}>
            {props.phase.states.map((state) => (
                <KanbanColumn state={state}>
                    <div>
                        {tasks.filter((item) => item.state === state).map((item) => (
                            <KanbanItem id={item.id} onDrop={() => {update(item.id, state)}}>
                                <div>{item.name}</div>
                            </KanbanItem>
                        ))}
                    </div>
                </KanbanColumn>
            ))}
        </DndProvider>
    )
}

export default Kanban

//Column

const boxTarget = {
    drop(props) {
        return {name: props.status}
    },
}

function KanbanColumn(props) {
    return props.connectDropTarget(<div>{props.children}</div>)
}

KanbanColumn = DropTarget("kanbanItem", boxTarget, (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop(),
}))(KanbanColumn)


//Item
const boxSource = {
    beginDrag(props) {
        return {
            name: props.id
        }
    },

    endDrag(props, monitor) {
        const item = monitor.getItem()
        const dropResult = monitor.getDropResult()
        if(dropResult){
            props.onDrop(monitor.getItem().name, dropResult.name)
        }
    }
}

function KanbanItem(props) {
    return props.connectDragSource(<div>{props.children}</div>)
}

KanbanItem = DragSource("kanbanItem", boxSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
}))(KanbanItem)