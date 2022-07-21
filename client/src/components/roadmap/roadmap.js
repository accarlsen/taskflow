import React, { useState, useContext, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import ReactFlow, { isEdge, Background, Controls, MiniMap, isNode } from 'react-flow-renderer';
import { getOneTask, removeTaskDep, updateTaskDep, getTasksInPhase } from '../../graphql/queries/tasks';
import { getUser } from '../../graphql/mutations/userMutations';
import UserContext from '../context/userContext';
import dagre from 'dagre';
import style from './roadmap.module.css';
import UserOrgContext from '../context/userOrgContext';
import EditTask from '../editTask/editTask'
import CreateTask from '../createTask/createTask'
import TestComponent from '../customNode/customNode';
import EndNode from '../customNode/customDefaultNodes/endNode'
import { getMembersInOrgID } from '../../graphql/queries/orgs'
import { getPhase } from '../../graphql/queries/project'
import usePopUp from '../popUpMsg/usePopUp';
import PopUpMsg from '../popUpMsg/popUpMsg';
import { useSpring, animated } from 'react-spring'
import { useHistory } from 'react-router';
import RoadmapTurtorial from './components/roadmapTurtorial'
import jwt_decode from "jwt-decode";
import Cookies from 'universal-cookie';
import CreateTaskRM from './components/createTaskRM';
import EditTaskRM from './components/editTaskRM';
//
import Fade from './../springs/fadeInOutTrans'

const onLoad = (reactFlowInstance) => {
    reactFlowInstance.fitView();
}


const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));
const getLayoutedElements = (elements) => {
    dagreGraph.setGraph({ rankdir: 'LR' });
    elements.forEach((el) => {
        if (isNode(el)) {
            dagreGraph.setNode(el.id, { width: 250, height: 200 });
        } else {
            dagreGraph.setEdge(el.source, el.target);
        }
    });
    dagre.layout(dagreGraph);
    return elements.map((el) => {
        if (isNode(el)) {
            const nodeWithPosition = dagreGraph.node(el.id);
            el.targetPosition = 'left';
            el.sourcePosition = 'right';

            el.position = {
                x: nodeWithPosition.x + Math.random() / 1000,
                y: nodeWithPosition.y,
            };
        }
        return el;
    });
};

const Roadmap = (props) => {
    const cookies = new Cookies();
    const editable = props.editable
    const phaseID = props.phaseID
    const showSidebar = props.showSidebar
    const preView = props.preView
    const [task, setTask] = useState(null)
    const [phase, setPhase] = useState(null)
    const [taskId, setTaskId] = useState("")
    const [taskUser, setTaskUser] = useState(null)
    const [addTask, setAddTask] = useState(false)
    // Use modal
    const spring = useSpring({
        from: { opacity: 0 },
        to: { opacity: 1 }
    })
    const { isShowing, toggle } = usePopUp()
    const dateNow = new Date().toISOString().substring(0, 10)
    //const [deletedEdge, setDeletedEdge] = useState(false)
    var orgID = useContext(UserOrgContext)
    if (!orgID && cookies.get("orgToken")) {
        orgID = cookies.get("orgToken");
    }
    const userLoggedIn = useContext(UserContext).userID
    let data = props?.props?.tasksInPhase
    var initialElements = []
    const [elements, setElements] = useState(getLayoutedElements(initialElements));
    //queries
    const { data: dataT, loading: loadingT } = useQuery(getOneTask, {
        variables: { taskID: taskId },
        skip: taskId === "",  //if task is not choosen skip
    });
    const { data: dataU, loading: loadingU } = useQuery(getUser, {
        variables: { userID: task?.assignedID },
        skip: !task, //if task is not choosen skip
    });

    const { data: membersInOrg } = useQuery(getMembersInOrgID, {
        variables: { orgID: orgID.orgID },
        skip: orgID.orgID === "",  //if task is not choosen skip
    });

    const { data: dataPhase, loading: loadingPhase } = useQuery(getPhase, {
        variables: { phaseID: phaseID },
        skip: (phaseID === "" || !phaseID),  //if phase is not choosen skip
    });

    //Cookies
    let ownerCheck = cookies.get("accessToken")
    var decoded
    if (ownerCheck) decoded = jwt_decode(ownerCheck);

    const history = useHistory()

    useEffect(() => {
        setTask(dataT?.task)
        setTaskUser(dataU?.user)
        setPhase(dataPhase?.phase)
    }, [dataT, dataU, loadingT, loadingU, data, dataPhase, loadingPhase]);

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown)
        document.addEventListener("keyup", handleKeyUp)
        return () => {
            document.removeEventListener("keydown", handleKeyDown)
            document.removeEventListener("keyup", handleKeyUp)
        }
    });

    if (data) {
        console.log(data)
        data.map((task, index) => {
            if (index === 0) {
                initialElements.push({
                    sourcePosition: 'right',
                    targetPosition: 'left',
                    id: task.id,
                    type: 'default',
                    data: {
                        label: <TestComponent data={task} editable={editable} dataTasks={data} elements={elements} />, name: task.name, text: task.description, archived: task.archived, assignedID: task.assignedID,
                        deadlineDate: task.deadlineDate, deadlineTime: task.deadlineTime,
                        progress: task.progress, state: task.state, weight: task.weight, ready: task.ready,
                        soonReady: task.soonReady, nextTasks: task.nextTasks, id: task.id, subtasks: task.subtasks
                    },
                    style: { border: '0px solid #777', minWidth: "10.1rem", backgroundColor: "var(--background2-color)" },
                    position: { x: (index + 1) * 200, y: window.innerHeight / 2 }
                })
                if (task.nextTasks) {
                    task.nextTasks.map((nextTask, nextTaskIndex) => {
                        initialElements.push({
                            id: nextTask + task.id,
                            source: task.id,
                            target: nextTask,
                            style: { strokeWidth: "3" }
                        })
                    })
                }
                if (data.length === 1) {
                    /*initialElements.push({  //link to end node
                        id:"end"+task.id,
                        source: task.id,
                        target: "end"
                    })*/
                    initialElements.push({
                        sourcePosition: 'right',
                        targetPosition: 'left',
                        id: "end",
                        type: 'output',
                        data: { label: <EndNode text={"Phase Finished!"} text2={"Phase Not Finished!"} tasks={data} /> },
                        style: { border: "0px solid grey", minWidth: "10.55rem", backgroundColor: "var(--background2-color)" },
                        position: { x: (index + 2) * 200, y: window.innerHeight / 2 }
                    })
                }
            }
            else if (index < data.length - 1) {
                initialElements.push({
                    sourcePosition: 'right',
                    targetPosition: 'left',
                    id: task.id,
                    type: 'default',
                    data: {
                        label: <TestComponent data={task} editable={editable} dataTasks={data} elements={elements} />,
                        name: task.name, text: task.description, archived: task.archived, assignedID: task.assignedID,
                        deadlineDate: task.deadlineDate, deadlineTime: task.deadlineTime,
                        progress: task.progress, state: task.state, weight: task.weight,
                        ready: task.ready, soonReady: task.soonReady, nextTasks: task.nextTasks, id: task.id, subtasks: task.subtasks
                    },
                    style: { border: '0px solid #777', minWidth: "10.1rem", backgroundColor: "var(--background2-color)" },
                    position: { x: (index + 1) * 200, y: window.innerHeight / 2 }
                })
                if (task.nextTasks) {
                    task.nextTasks.map((nextTask, nextTaskIndex) => {
                        initialElements.push({
                            id: nextTask + task.id,
                            source: task.id,
                            target: nextTask,
                            style: { strokeWidth: "3" }
                        })
                    })
                }
            }

            else if (index === data.length - 1) {
                initialElements.push({
                    sourcePosition: 'right',
                    targetPosition: 'left',
                    id: task.id,
                    type: 'default',
                    data: {
                        label: <TestComponent data={task} editable={editable} dataTasks={data} elements={elements} />,
                        name: task.name, text: task.description, archived: task.archived, assignedID: task.assignedID,
                        deadlineDate: task.deadlineDate, deadlineTime: task.deadlineTime,
                        progress: task.progress, state: task.state, weight: task.weight,
                        ready: task.ready, soonReady: task.soonReady, nextTasks: task.nextTasks, id: task.id, subtasks: task.subtasks
                    },
                    style: { border: '0px solid #777', minWidth: "10.1rem", backgroundColor: "var(--background2-color)" },
                    position: { x: (index + 1) * 200, y: window.innerHeight / 2 }
                })
                if (task.nextTasks) {
                    task.nextTasks.map((nextTask, nextTaskIndex) => {
                        initialElements.push({
                            id: nextTask + task.id,
                            source: task.id,
                            target: nextTask,
                            style: { strokeWidth: "3" }
                        })
                    })
                }
                //Add end task
                /*initialElements.push({ //Link to end node
                    id:task.id+"end",
                    source: task.id,
                    target: "end"
                })*/
                initialElements.push({
                    sourcePosition: 'right',
                    targetPosition: 'left',
                    id: "end",
                    type: 'output',
                    data: { label: <EndNode text={"Phase Finished!"} text2={"Phase Not Finished!"} tasks={data} /> },
                    style: { border: "0px solid grey", minWidth: "10.1rem" },
                    position: { x: (index + 2) * 200, y: window.innerHeight / 2 }
                })
            }
        })
        if (elements && initialElements.length > elements.length) {
            setElements(getLayoutedElements(initialElements))
        } else if (!elements && initialElements.length > 0) {
            setElements(getLayoutedElements(initialElements))
        } else if (elements && initialElements && initialElements.length < elements.length) {
            setElements(getLayoutedElements(initialElements))
        }

        for (var i = 0; i < elements.length; i++) { //Check if tasks are edited
            if (elements[i] && initialElements[i] && elements[i].data && initialElements[i].data && (
                elements[i].data.text !== initialElements[i].data.text ||
                elements[i].data.archived !== initialElements[i].data.archived ||
                elements[i].data.assignedID !== initialElements[i].data.assignedID ||
                elements[i].data.deadlineDate !== initialElements[i].data.deadlineDate ||
                elements[i].data.deadlineTime !== initialElements[i].data.deadlineTime ||
                elements[i].data.progress !== initialElements[i].data.progress ||
                elements[i].data.state !== initialElements[i].data.state ||
                elements[i].data.name !== initialElements[i].data.name ||
                elements[i].data.weight !== initialElements[i].data.weight
            )) {
                setElements(getLayoutedElements(initialElements))
            }
        }
    }


    const addTaskDependencies = () => {
        elements.map(element => { //Loop thorugh elements
            if (element.source && element.target) { //Find if it is an edge
                data.map(task => { //Loop through tasks in db
                    let first = false
                    if (task?.nextTasks) {  //does the task have next task?
                        var ok = true
                        task.nextTasks.map(nextTask => { //Loop through next tasks in db
                            if (nextTask === element.target) {
                                ok = false  //the task is already added as next task
                            }
                        })
                        if (ok && element.source === task.id) { //&& element.target!= 'end'
                            let check = findFirst()
                            if (!check.includes(element.source)) {
                                first = true
                            }
                            updateTasks({ variables: { taskID: element.source, nextTask: element.target, firstTask: first } })
                        }
                    } if ((task?.nextTasks === null || task?.nextTasks?.length === 0) && task.id === element.source) {
                        let check = findFirst()
                        if (!check.includes(element.source)) {
                            first = true
                        }
                        updateTasks({ variables: { taskID: element.source, nextTask: element.target, firstTask: first } })
                    }
                })
            }
        })
        setElements(getLayoutedElements(initialElements))
    };

    const [updateTasks] = useMutation(updateTaskDep, {
        variables: {},
        refetchQueries: [
            {
                query: getTasksInPhase,
                variables: {
                    phaseID: phaseID
                },
            }
        ]
    });
    const [deleteTaskDep] = useMutation(removeTaskDep, {
        variables: {},
        refetchQueries: [
            {
                query: getTasksInPhase,
                variables: {
                    phaseID: phaseID
                },
            }
        ]
    });

    const findFirst = () => {
        let dependentTasks = []
        data.map(taskk => {
            data.map(task => { //Loop through tasks in db
                if (task?.nextTasks) {  //does the task have next task?
                    task?.nextTasks.map(nextTask => { //Loop through next tasks in db
                        if (nextTask === taskk.id) {
                            if (!dependentTasks.includes(taskk.id)) dependentTasks.push(taskk.id)
                        }
                    })
                }
            })
        })
        return dependentTasks
    };




    const onConnect = (event) => {
        var ok = true
        elements.map(element => {
            if (isEdge(element) && element.source === event.source || element.target === event.source) {

                elements.map(betweenElement => {
                    if (isEdge(betweenElement) && element.id !== betweenElement.id && betweenElement.target === event.target && element.target === betweenElement.source && betweenElement.target !== 'end') { //&&(betweenElement.source!=='start' || betweenElement.target!=='end')
                        ok = false
                    }
                    /*if(isEdge(betweenElement) && betweenElement.target===event.source && betweenElement.target === element.target  && betweenElement.id!==element.id ) { //
                        console.log("OK 2 false", betweenElement.target)
                        ok=false
                    }*/
                    if (isEdge(betweenElement) && betweenElement.target === element.source && event.target === betweenElement.source) {  //Avoid back edge
                        ok = false
                    }
                    if (isEdge(betweenElement) && betweenElement.target === event.source) {
                        let taskBefore = data.find(source => source.id === betweenElement.source)
                        if (taskBefore?.nextTasks) {
                            taskBefore?.nextTasks?.map(nextTask => {
                                if (nextTask === event.target) {
                                    console.log("feil")
                                    ok = false
                                }
                            })
                        }
                    }
                })
            }
            if (isEdge(element) && event.source === element.source) { //find the event source
                const sourceTask = data.find(source => source.id === event.source)
                let queue = [];
                queue.push(sourceTask.id);
                while (queue.length > 0) {
                    let currentTask = data.find(source => source.id === queue[0]);

                    if (currentTask?.id === event.target) {
                        ok = false;
                    }
                    if (currentTask?.nextTasks) {
                        currentTask?.nextTasks?.map(nextTask => {
                            if (nextTask === event.target) {
                                ok = false
                            }
                            let foundTask = queue.find(task => nextTask === task)
                            if (!foundTask) queue.push(nextTask)
                        })
                    }
                    queue.shift();
                }
            }
        })
        if (ok) {
            initialElements.push({
                id: event.source + event.target,
                source: event.source,
                target: event.target
            })
            elements.push({
                id: event.source + event.target,
                source: event.source,
                target: event.target
            })
            /*setElements((els) => addEdge({
                id:event.source+event.target,
                source: event.source,
                target: event.target
            }, els))*/

            setElements(getLayoutedElements(initialElements))
            addTaskDependencies()
            if (isShowing) {
                toggle();
            }
        } else {
            // Make notification
            if (!isShowing && (localStorage.getItem("showPopUp") === null || localStorage.getItem("showPopUp") === undefined)) {
                toggle();
            }
        }
    }

    let control = false
    let handleKeyDown = (event) => {
        if (event.key === "Control") {
            control = true
        }
        if (control && event.key === "Enter") {
            setAddTask(true)
        }
        let check = localStorage?.getItem("tutorialOpen")
        if(event.key === "Escape" && (check?.match(false) || (check === null || check === undefined))) {
            history.push("/projects/" + dataPhase.phase.projectID) 
        }
    }

    let handleKeyUp = (event) => {
        if (event.key === "Control") {
            control = false
            localStorage.removeItem("prevTask")
        }
    }

    const onElementClick = (event, element) => {
        if (!isEdge(element) && editable) {
            {element.id !== "end" && setTaskId(element.id)}
            if (control && (localStorage.getItem("prevTask") === null || localStorage.getItem("prevTask") === undefined)) {
                localStorage.setItem("prevTask", element.id)
            }
            else if (localStorage.getItem("prevTask") !== null && localStorage.getItem("prevTask") !== undefined) {
                let ok = true
                elements.map(elementt => {
                    if (isEdge(elementt) && elementt.source === localStorage.getItem("prevTask") || elementt.target === localStorage.getItem("prevTask")) {
                        elements.map(betweenElement => {
                            if (isEdge(betweenElement) && elementt.id !== betweenElement.id && betweenElement.target === element.id && elementt.target === betweenElement.source && betweenElement.target !== 'end') { //&&(betweenElement.source!=='start' || betweenElement.target!=='end')
                                ok = false
                            }
                            if (isEdge(betweenElement) && betweenElement.target === elementt.source && element.id === betweenElement.source) {  //Avoid back edge
                                ok = false
                            }
                            if (isEdge(betweenElement) && betweenElement.target === event.source) {
                                let taskBefore = data.find(source => source.id === betweenElement.source)
                                if (taskBefore?.nextTasks) {
                                    taskBefore?.nextTasks?.map(nextTask => {
                                        if (nextTask === event.target) {
                                            ok = false
                                        }
                                    })
                                }
                            }
                        })
                    }
                    if (isEdge(elementt) && localStorage.getItem("prevTask") === elementt.source) { //find the event source
                        const sourceTask = data.find(source => source.id === localStorage.getItem("prevTask"))
                        let queue = [];
                        queue.push(sourceTask.id);
                        while (queue.length > 0) {
                            let currentTask = data.find(source => source.id === queue[0]);

                            if (currentTask?.id === element.id) {
                                ok = false;
                            }
                            if (currentTask?.nextTasks) {
                                currentTask?.nextTasks?.map(nextTask => {
                                    if (nextTask === element.id) {
                                        ok = false
                                    }
                                    let foundTask = queue.find(task => nextTask === task)
                                    if (!foundTask) queue.push(nextTask)
                                })
                            }
                            queue.shift();
                        }
                    }
                })
                if (ok) {
                    initialElements.push({
                        id: localStorage.getItem("prevTask") + element.id,
                        source: localStorage.getItem("prevTask"),
                        target: element.id
                    })
                    elements.push({
                        id: localStorage.getItem("prevTask") + element.id,
                        source: localStorage.getItem("prevTask"),
                        target: element.id
                    })
                    setElements(getLayoutedElements(initialElements))
                    addTaskDependencies()
                    if (isShowing) {
                        toggle();
                    }
                }
                else {
                    // Make notification
                    if (!isShowing && (localStorage.getItem("showPopUp") === null || localStorage.getItem("showPopUp") === undefined)) {
                        toggle();
                    }
                }
                localStorage.removeItem("prevTask")
            }
        } 
    };

    /*
    var checkStorage = localStorage.getItem("prevTask")
    console.log(checkStorage)
    if(checkStorage !== "" || checkStorage !== null || checkStorage !== undefined) {
        if(checkStorage !== taskId) {
            console.log("Connect the tasks here")
            console.log("From:", checkStorage, " To:", taskId)
            if(checkStorage !== null) {
                updateTasks({variables:{taskID: checkStorage, nextTask: taskId, firstTask: false}})
            }
            localStorage.removeItem("prevTask")
        }
    }*/

    const onElementsRemove = (event) => {
        if (isEdge(event[0])) {
            for (var i = 0; i < elements.length; i++) {
                if (elements[i].id === event[0].id) {
                    initialElements.splice(i, 1)
                    setElements(getLayoutedElements(initialElements));
                    deleteTaskDep({
                        variables: { taskID: event[0].source, nextTask: event[0].target}
                    })
                }
            }
        }
    }

    return (
        <div className={props.preView ? style.preViewWrapper : style.wrapper}>
            <div className={` ${style.inline}`}>
                {!preView && <button className={`${style.button}`} onClick={() => { history.push("/projects/" + dataPhase.phase.projectID) }} >
                    <span className={`${style.buttonText}`}>{" < Back to project overview "}</span>
                </button>}
                {!preView && <RoadmapTurtorial />}
                <h3 className={`my-1 `}>{dataPhase ? dataPhase.phase.name : "Current Phase"}</h3>
            </div>
            <animated.div style={spring} className={showSidebar ? style.flexboxContainer : style.flexboxContainerWithoutSidebar}>
                <ReactFlow
                    className={style.roadmap}
                    nodesDraggable={editable}
                    nodesConnectable={editable}
                    elementsSelectable={editable}
                    selectNodesOnDrag={editable}
                    elements={elements}
                    onLoad={onLoad}
                    style={{ width: '100%', height: showSidebar ? '100vh' : props.preView ? '75vh' : '40vh'}}
                    onConnect={onConnect}
                    onElementsRemove={onElementsRemove}
                    connectionLineStyle={{ stroke: "#ddd", strokeWidth: 2 }}
                    connectionLineType="bezier"
                    snapToGrid={true}
                    snapGrid={[16, 16]}
                    onElementClick={onElementClick}
                    deleteKeyCode={46}
                >
                    
                    <Background
                        color="#888"
                        gap={16}
                    />
                    <MiniMap
                        style={{ backgroundColor: "var(--background2-color)" }}
                        maskColor={"var(--mask-color)"}
                        nodeColor={n => {
                            let doneCheckArr = []
                            let ok = true
                            for (let i = 0; i < data?.length; i++) {
                                for (let j = 0; j < data[i]?.nextTasks?.length; j++) {
                                    if (data[i]?.nextTasks[j] === n.id) {
                                        doneCheckArr.push(data[i])
                                    }
                                }
                            }
                            for (let i = 0; i < doneCheckArr.length; i++) {
                                if (doneCheckArr[i].state !== "done") {
                                    ok = false
                                }
                            }
                            if (n.type === 'input') return '#00FA9A';
                            if (ok && n.type === 'output') return "var(--green)"
                            if (n.data.state === "done") return 'var(--green)';
                            if (ok && n.data.deadlineDate >= dateNow) return "var(--yellow)";
                            if (ok && n.data.deadlineDate < dateNow) return "var(--red)";
                            else return "var(--grey)"
                        }} />
                    <Controls />
                </ReactFlow>
                <PopUpMsg isShowing={isShowing} hide={toggle} spring={spring} msg={"Unvalid Connection"} />
                {showSidebar && (
                    <div className={style.sidebarWrapper}>
                        <p className={style.information}>{dataPhase ? dataPhase.phase.name : "Task info"}</p>
                        {task && (
                            <Fade show={task !== null || task !== undefined} fromBottom={true}>
                                <div>
                                    <p className="p ml-2">{task.name}</p>
                                    <p className='p-grey ml-2 mt-3'>{task.deadlineTime !== "23:59:00" ? ("Deadline: " + task.deadlineTime.slice(0, 5) + " - " + task.deadlineDate.replaceAll("-", ".")) : ("Deadline: " + task.deadlineDate.replaceAll("-", "."))}</p>
                                    {task.deadlineDate < dateNow && <p className={`p ml-2 mt-3 ${style.overdue}`}>Overdue</p>}
                                    {taskUser && (<p className='p-grey ml-2 mt-2 mb-4'>Assigned to: {taskUser.fname} {taskUser.lname}</p>)}
                                    {task.state && (<p className='p ml-2 mt-3 mb-4'>Status: {task.state}</p>)}
                                </div>
                                <div className='ml-3'>
                                    {((userLoggedIn === task.authorID) || (decoded.admin === 1 || decoded.owner === 1)) && (<EditTaskRM subtask={task} />)}
                                </div>
                            </Fade>
                        )}
                        <button className='ml-2'>
                            <CreateTaskRM projectID={dataPhase?.phase?.projectID} phaseID={phaseID} orgTag={false} />
                        </button>
                    </div>
                )}
            </animated.div>
        </div>
    )
}

export default Roadmap;