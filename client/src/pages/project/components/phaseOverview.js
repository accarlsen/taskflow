import { useQuery } from '@apollo/client';
import React, { useContext, useEffect, useState, useRef } from 'react';
import UserContext from '../../../components/context/userContext';
import CreateTask from '../../../components/createTask/createTask';
import ProgressDonut from '../../../components/progressDonut/progressDonut';
import { getPhase, getPhases, updateProject, getProject } from '../../../graphql/queries/project';
import { getTasksInPhase } from '../../../graphql/queries/tasks';
import style from './../project.module.css';
import Roadmap from '../../../components/roadmap/roadmap'
import { Link, useHistory } from 'react-router-dom';
import TaskList from '../../../components/taskList/taskList';
import Cookies from 'universal-cookie';
import jwt_decode from "jwt-decode";
import {animated, useSpring} from 'react-spring'
import Kanban from './kanban';
import Fade from './../../../components/springs/fadeInOutTrans'

function PhaseOverview(props) {
    const today = new Date()
    const history = useHistory()
    const project = props.project
    const cookies = new Cookies();
    var phaseToken = cookies.get("phaseToken");
    const [selectedPhase, setSelectedPhase] = useState(props.phaseID);
    const [dropDown, setDropDown] = useState(false);
    const userID = useContext(UserContext)
    var accessToken = cookies.get("accessToken");
    var decoded
    var showEditRoadmapButton = false
    if (accessToken) {
        decoded = jwt_decode(accessToken);
        if (decoded.owner === 1 || decoded.admin === 1) showEditRoadmapButton = true
    }

    const [showRoadmap, setShowroadmap] = useState(false);

    const { data, loading } = useQuery(getPhase, {
        variables: { phaseID: selectedPhase }
    })
    /*const [UpdateProject] = useMutation(updateProject, {
        variables: {}
    });
    const { data: dataProject, error } = useQuery(getProject, {
        variables: { projectID: props.project.project.id }
    });*/


    const { data: dataP } = useQuery(getPhases, {
        variables: { projectID: props.projectID }
    })
    console.log(dataP)

    //If the phase saved in local storage is in the same project set phase to the one stored in local storage else set it to current phase in project
    if(phaseToken && phaseToken !== selectedPhase && dataP) {
        let ok = false
        dataP?.phases?.map(phase =>{
            if(phase.id=== phaseToken) ok = true
        })
        if(ok) setSelectedPhase(phaseToken)
        else cookies.remove("phaseToken")
    }
    const { data: dataT } = useQuery(getTasksInPhase, {
        variables: { phaseID: selectedPhase },
        skip: (selectedPhase === null || selectedPhase === undefined)
    });

    const rotate = useSpring({
        transform: dropDown ? 'rotate(90deg)' : 'rotate(0deg)'
    })

    const roadmapPreviewRef = useRef(null)
    const executeScroll = () => roadmapPreviewRef.current.scrollIntoView()

    const kanban = true

    useEffect(() => {
        if (!selectedPhase && data) setSelectedPhase(data.phases[0])
    }, [data, loading])

    if (data) {
        const h = data.phase.weight;
        const hw = data.phase.progress;
        let progress = 0;
        if (hw !== 0) { progress = (hw / h) * 100 }
        const r = h - hw;
        var diff =  Math.floor(( today - Date.parse(data.phase.startDate) ) / 86400000) + 1; 
        var diffR =  Math.floor(( Date.parse(data.phase.endDate) - today) / 86400000) + 1; 

        console.log(diffR)

        let ww = hw; 
        if(diff > 7) ww = Math.round((hw*10)/(diff/7))/10;
        let fww = r;
        if(diffR > 7) fww = Math.round((r*10)/(diffR/7))/10;

        const currentPhase = data.phase.id;

        /*if (!kanban) {*/
            return (
            <div>
                <div className={style.phaseWrapper}>
                    <div className={style.phaseLeft}>
                        <div className={style.dropDownPhase}>
                            <div className="dropDownWrapper">
                                <div className="dropDownCurrent" onClick={() => { setDropDown(!dropDown) }}>
                                    <animated.img className={style.arrow} style={rotate} src="https://icon-library.com/images/arrow-icon-white/arrow-icon-white-29.jpg"></animated.img>
                                    <span>{data.phase.name}</span>
                                </div>
                                <div className="dropDownList">
                                    {dataP?.phases?.map(data => {
                                        if (data.id !== currentPhase) return (
                                            <Fade fromBottom={true} leaveBottom={true} show={dropDown} key={data.id}>
                                                <div key={data.id} className="dropDownOption" onClick={() => {
                                                    cookies.set('phaseToken', data.id, { path: '/' });
                                                    setSelectedPhase(data.id); 
                                                    setDropDown(false); 
                                                    setShowroadmap(false) }}>
                                                    <span>{data.name}</span>
                                                </div>
                                            </Fade>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="ma">
                            <ProgressDonut
                                progress={progress}
                                size={100}
                                strokeWidth={14}
                                circleOneStroke='#3f3f3f'
                                circleTwoStroke='#09D28A'
                            />
                            <h4 className="mb-2">{data.phase.name}</h4>
                        </div>
                        <div>
                            <div className={style.stats}>
                                <p className="p">{"Total hours: "}</p>
                                <p className="p right">{h}</p>
                            </div>
                            <div className={style.stats}>
                                <p className="p">{"Hours worked: "}</p>
                                <p className="p right">{hw}</p>
                            </div>
                            <div className={style.stats}>
                                <p className="p">{"Hours remaining: "}</p>
                                <p className="p right">{r}</p>
                            </div>
                            <div className={style.stats}>
                                <p className="p">{"Weekly workload: "}</p>
                                <p className="p right">{ww}</p>
                            </div>
                            <div className={style.stats}>
                                <p className="p">{"Future w. workload: "}</p>
                                <p className="p right">{fww}</p>
                            </div>
                            {hw === 0 && <p className={`${style.status} ${style.yellow}`}>Not started</p>}
                            {Math.floor(( Date.parse(data.phase.endDate) - Date.parse(today) ) / 86400000) >= 0 && hw !== 0 && fww <= ww && <p className={`${style.status} ${style.green}`}>On track</p>}
                            {hw === h && Math.floor(( Date.parse(data.phase.endDate) - Date.parse(today) ) / 86400000) < 0 && <p className={`${style.status} ${style.green}`}>Completed</p>}
                            {hw !== 0 && hw !== h && Math.floor(( Date.parse(data.phase.endDate) - Date.parse(today) ) / 86400000) < 0 && <p className={`${style.status} ${style.red}`}>Not Completed</p>}
                            {hw !== 0 && Math.floor(( Date.parse(data.phase.endDate) - Date.parse(today) ) / 86400000) >= 0 && fww > ww && (fww - ww) < (fww * 0.1) && <p className={`${style.status} ${style.yellow}`}>Behind schedule</p>}
                            {hw !== 0 && Math.floor(( Date.parse(data.phase.endDate) - Date.parse(today) ) / 86400000) >= 0 && fww > ww && (fww - ww) > (fww * 0.1) && <p className={`${style.status} ${style.red}`}>Needs overview</p>}
                        </div>

                        <button 
                            className={`mt-6 button2 ${style.roadmapButton}`} 
                            onClick={() => {
                                showRoadmap === false ? (setShowroadmap(true)) : setShowroadmap(false)
                                if(!showRoadmap) executeScroll()
                            }}>
                            {showRoadmap ? (<div>Hide roadmap</div>) : <div>Preview Roadmap</div>}
                        </button>

                        {(showEditRoadmapButton || userID === project.project.projectLeadID) &&
                            <Link className={`a1 ${style.editRoadmapButtonWrapper}`} to={"/roadmap/" + selectedPhase}>
                                <div className={`mt-1 button2 ${style.editRoadmapButton}`}>Edit roadmap</div>
                            </Link>
                        }
                    </div>
                    {dataT && <div>
                        <div className={style.wrapperWrapper}>
                            <div className="my-4 mt-10"><CreateTask orgTag={false} phaseID={selectedPhase} phaseStartDate={data.phase.startDate} phaseEndDate={data.phase.endDate} projectID={props.projectID} /></div>
                            <TaskList data={dataT.tasksInPhase} phaseID={data.phase.id} projectID={props.projectID} userID={userID.userID} period={1} />
                        </div>
                    </div>}

                </div>
                <div className={style.roadmapWrapper}>
                    <div ref={roadmapPreviewRef} className="ma">
                        <Fade fromLeft={true} show={showRoadmap}><Roadmap props={dataT} editable={false} showSidebar={false} phaseID={selectedPhase} preView={true}></Roadmap></Fade>
                    </div>
                </div>
            </div>

        )
        /*} else return(<div>{dataT && <Kanban phase={data.phase} tasksInPhase={dataT.tasksInPhase} /> }</div>) */

    } else {
        return (<div></div>)
    }

}

export default PhaseOverview;