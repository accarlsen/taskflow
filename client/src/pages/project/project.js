import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import UserContext from '../../components/context/userContext';
import ErrorMessage from '../../components/errorMessage/errorMessage';
import ProgressDonut from '../../components/progressDonut/progressDonut';
import { getUser } from '../../graphql/mutations/userMutations';
import { updateProject } from '../../graphql/queries/project';
import { archiveProject } from '../../graphql/queries/tasks';
import { getMembersInProject, getPhases, getProject, removeMemberFromProject } from './../../graphql/queries/project';
import AddPhase from './components/addPhase';
import PhaseEdit from './components/phaseEdit';
import PhaseOverview from './components/phaseOverview';
import SearchMember from './components/searchMember';
import SearchProjectMonitor from './components/searchProjectMonitor';
import SearchUser from './components/searchUser';
import style from './project.module.css';
import Cookies from 'universal-cookie';
import jwt_decode from "jwt-decode";
import Kanban from './components/kanban';
import Fade from './../../components/springs/fadeInOutTrans'


function Project() {
    const history = useHistory();

    //Context
    const userID = useContext(UserContext);
    const projectID = window.location.href.split("/")[window.location.href.split("/").length - 1];

    //States & input values
    const today = new Date()
    const [edit, setEdit] = useState(false)
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState();
    const [endDate, setEndDate] = useState();
    const [projectLeadID, setProjectLeadID] = useState("");
    const [projectMonitorID, setProjectMonitorID] = useState("");
    const [projectModified, setProjectModified] = useState(false);

    //access state
    const cookies = new Cookies();
    var accessToken = cookies.get("accessToken");
    var decoded
    if (accessToken) decoded = jwt_decode(accessToken);

    //Error feedback
    const [noErrors, setNoErrors] = useState(false);
    const [startDateError, setStartDateError] = useState("")
    const [endDateError, setEndDateError] = useState("")
    const [nameError, setNameError] = useState("");
    const [currentPhase, setCurrentPhase] = useState("");

 
    //Queries
    const [UpdateProject] = useMutation(updateProject, {
        variables: projectID, name, description, startDate, endDate, projectLeadID, projectMonitorID
    })

    const [ArchiveProject] = useMutation(archiveProject, {
        variables: projectID
    })

    const { data, error } = useQuery(getProject, {
        variables: { projectID: projectID }
    });

    const { data: dataP } = useQuery(getPhases, {
        variables: { projectID: projectID }
    })

    const { data: dataU } = useQuery(getMembersInProject, {
        variables: { projectID: projectID }
    })

    const [GetProjectLead, { data: dataProjectLead }] = useLazyQuery(getUser)
    const [GetProjectMonitor, { data: dataProjectMonitor }] = useLazyQuery(getUser)

    const [RemoveMember] = useMutation(removeMemberFromProject, {
        variables: { projectID: projectID }
    })

    const handleKeyDown = (event) => {
        if(event.key === "Escape" && edit) {
            setEdit(false)
        }
    }

    useEffect(() => {
        if (data) {
            setName(data.project.name);
            setCurrentPhase(data.project.currentPhase);
            if (data.project.description !== null) setDescription(data.project.description);
            setStartDate(new Date(String(data.project.startDate)).toISOString().substring(0, 10));
            setEndDate(new Date(String(data.project.endDate)).toISOString().substring(0, 10));
            setProjectLeadID(data.project.projectLeadID)
            if (data.project.projectMonitorID !== null) setProjectMonitorID(data.project.projectMonitorID)

            GetProjectLead({ variables: { userID: data.project.projectLeadID } })
            if (data.project.projectMonitorID) {
                GetProjectMonitor({ variables: { userID: data.project.projectMonitorID } })
            }
            document.addEventListener("keydown", handleKeyDown)
            return () => {
                document.removeEventListener("keydown", handleKeyDown)
            }
        }
    }, [data, dataU, dataP, dataProjectLead, dataProjectMonitor, edit]);

    if (error) { console.log(error.message) }

    if (data) {
        const h = data.project.weight;
        const hw = data.project.progress;
        let progress = 0;
        if (hw !== 0) { progress = (hw / h) * 100 }
        const r = h - hw;
        var diff =  Math.floor(( today - Date.parse(startDate) ) / 86400000) + 1; 
        var diffR =  Math.floor(( Date.parse(endDate) - today) / 86400000) + 1; 
        console.log(diffR)
        console.log(diff)
        let ww = hw; 
        if(diff > 7) ww = Math.round((hw*10)/(diff/7))/10;
        let fww = hw;
        if(diff > 7) fww = Math.round((r*10)/(diff/7))/10;

        return (
            <Fade show={true}>
                <div style={edit ? { height: "100vh", overflow: "hidden" } : { overflow: "auto" }}>
                    {edit && <div className={style.background}>
                        <div className={style.filterColor}>
                            <Fade fromBottom={true} show={edit}>
                                <div className={style.editWrapper}>
                                    <div className={style.editTopBar}>
                                        <h3 className="py-2">{"Settings - " + data.project.name}</h3>
                                        <button className={`p exitButton`} onClick={() => { setEdit(false) }}>X</button>
                                    </div>
                                    <div className={style.editGrid}>
                                        <div className="mb-8">
                                            <h4 className="my-3">{"Project settings"}</h4>
                                            <div className={style.editProjectWrapper}>
                                                <div className={`${style.row1}`}>
                                                    <div className={`my-1 ${style.inline}`}>
                                                        <p className="p">{"Name: "}</p>
                                                        <div>
                                                            <input className={`input ${style.name}`} value={name} placeholder={"name..."}
                                                                onChange={e => {
                                                                    setName(String(e.target.value));
                                                                    if (String(e.target.value) !== data.project.name) setProjectModified(true)
                                                                    let nameErrorT = true;
                                                                    if (String(e.target.value.replace(/\s/g, '')).length >= 3) {
                                                                        setNameError("")
                                                                        nameErrorT = false
                                                                    }

                                                                    //Check for all errors
                                                                    if (nameErrorT || startDateError !== "" || endDateError !== "" || startDate === "" || endDate === "") {
                                                                        setNoErrors(false)
                                                                    } else {
                                                                        setNoErrors(true)
                                                                    }
                                                                }}
                                                                onBlur={e => {
                                                                    let nameErrorT = false
                                                                    if (String(e.target.value.replace(/\s/g, '')).length < 3) {
                                                                        setNameError("Project name must be longer than 2 characters")
                                                                        nameErrorT = true;
                                                                    }
                                                                    else setNameError("")

                                                                    //Check for all errors
                                                                    if (nameErrorT || startDateError !== "" || endDateError !== "" || startDate === "" || endDate === "") {
                                                                        setNoErrors(false)
                                                                    } else setNoErrors(true)
                                                                }}
                                                            ></input>
                                                            <ErrorMessage errorMessage={nameError} />
                                                        </div>
                                                    </div>

                                                    <textarea className={`input mt-3 ${style.description}`} value={description} placeholder={"description..."} onChange={e => { setDescription(String(e.target.value)); }}></textarea>

                                                    <div className={`my-2 mt-4 ${style.inline}`}>
                                                        <p className="p my-1">{"Start date: "}</p>
                                                        <div>
                                                            <input className="input" type="date" value={startDate} onChange={e => {
                                                                let startDateErrorT = true
                                                                if (endDate === "" || e.target.value < endDate) {
                                                                    setStartDateError("")
                                                                    setStartDate(e.target.value)
                                                                    setProjectModified(true)
                                                                    startDateErrorT = false
                                                                } else {
                                                                    setStartDateError("Start date must be before the end date")
                                                                    setStartDate(new Date(String(data.project.startDate)).toISOString().substring(0, 10))
                                                                }

                                                                //Check for all errors
                                                                if (nameError !== "" || startDateErrorT || endDateError !== "" || endDate === "") {
                                                                    setNoErrors(false)
                                                                } else setNoErrors(true)
                                                            }}></input>
                                                            <ErrorMessage errorMessage={startDateError} />
                                                        </div>
                                                    </div>

                                                    <div className={`my-1 ${style.inline}`}>
                                                        <p className="p my-1">{"End date: "}</p>
                                                        <div>
                                                            <input className="input" type="date" value={endDate} onChange={e => {
                                                                let endDateErrorT = true
                                                                if (startDate === "" || startDate < e.target.value) {
                                                                    setEndDateError("")
                                                                    setEndDate(e.target.value);
                                                                    setProjectModified(true)
                                                                    endDateErrorT = false
                                                                } else {
                                                                    setEndDateError("End date must be after the start date")
                                                                    setEndDate(new Date(String(data.project.endDate)).toISOString().substring(0, 10));
                                                                }

                                                                //Check for all errors
                                                                if (nameError !== "" || startDateError !== "" || endDateErrorT || startDate === "") {
                                                                    setNoErrors(false)
                                                                } else setNoErrors(true)
                                                            }}></input>
                                                            <ErrorMessage errorMessage={endDateError} />
                                                        </div>
                                                    </div>

                                                    <div className="mt-6">
                                                        <button className="button2 mr-4" onClick={e => {
                                                            e.preventDefault();
                                                            ArchiveProject({
                                                                variables: {
                                                                    projectID: String(data.project.id),
                                                                    archived: true,
                                                                }
                                                            });
                                                            history.push("/projects")
                                                        }}>Archive</button>
                                                        <button className={`${noErrors && projectModified ? "buttonGreen" : "buttonInactive"}`} onClick={e => {
                                                            e.preventDefault();
                                                            if (noErrors && projectModified) {
                                                                UpdateProject({
                                                                    variables: {
                                                                        projectID: String(data.project.id),
                                                                        name: name,
                                                                        description: description,
                                                                        startDate: startDate,
                                                                        endDate: endDate,
                                                                        archived: false,
                                                                        projectLeadID: projectLeadID,
                                                                        projectMonitorID: projectMonitorID,
                                                                        currentPhase: currentPhase
                                                                    },
                                                                    refetchQueries: [{ query: getProject, variables: { projectID: projectID } }]
                                                                });
                                                                setEdit(false)
                                                            }
                                                        }}>{"Save"}</button>
                                                    </div>
                                                </div>
                                                <div className={style.row2}>
                                                    <div className={style.inlineSearch}>
                                                        <span className="p my-1">{"Project Lead: "}</span>
                                                        <SearchUser project={data.project} />
                                                    </div>
                                                    {/*<div className={`mt-1 ${style.inlineSearch}`}>
                                                        <span className="p my-1">{"Project Monitor: "}</span>
                                                        <SearchProjectMonitor project={data.project} />
                                                    </div>*/}
                                                    <div>
                                                        <h4 className="mt-6 mb-1">{"Users: "}</h4>
                                                        <SearchMember project={data.project} />
                                                        <div className={style.userList}>
                                                            {dataU.membersInProject.map(data => (
                                                                <div className={style.userListItem}>
                                                                    <p key={data.id} className="p ml-1 py-1 unselectable">
                                                                        {data.fname + " " + data.lname}
                                                                    </p>
                                                                    <button className={`${style.userRemoveButton}`} onClick={e => {
                                                                        e.preventDefault()
                                                                        RemoveMember({
                                                                            variables: {
                                                                                projectID: projectID,
                                                                                userID: data.id
                                                                            },
                                                                            refetchQueries: [{ query: getMembersInProject, variables: { projectID: projectID } }]
                                                                        })
                                                                    }}>{"X"}</button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {dataP.phases.map(phase => (
                                            <PhaseEdit key={phase.id} projectStart={data.project.startDate} projectEnd={data.project.endDate} key={phase.id} phase={phase} phases={dataP.phases} />
                                        ))}
                                        {dataP && <AddPhase phases={dataP.phases} />}
                                    </div>
                                </div>
                            </Fade>
                        </div>
                    </div>}
                    <div>
                        <div className={`py-1 ${style.infobar}`}>
                            <button className={` ${style.button}`} onClick={() => { history.push("/projects") }}>
                                <span className={style.buttonText}>{" < Projects "}</span>
                            </button>
                            <div className={style.projectName}>
                                <h4 className={style.infoBarTitle}>{data.project.name}</h4>
                                <div>
                                    {(data.project.projectLeadID === userID.userID || (data.projectMonitorID !== null && data.projectMonitorID === userID.userID) || decoded?.admin === 1 || decoded?.owner === 1) && <button className={` ${style.button}`} onClick={() => { setEdit(true) }}>
                                        <span className={style.buttonText}>{"Edit"}</span>
                                    </button>}
                                </div>
                            </div>

                        </div>
                        <div className={style.innerWrapper}>
                            <div className={style.overview}>
                                <div className="ma">
                                    <ProgressDonut
                                        progress={progress}
                                        size={100}
                                        strokeWidth={14}
                                        circleOneStroke='#3f3f3f'
                                        circleTwoStroke='#09D28A'
                                    />
                                    <h4>Total progress</h4>
                                </div>
                                <div>
                                    <h4 className="mb-2">Statistics</h4>
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
                                    {console.log(Math.floor(( Date.parse(endDate) - Date.parse(today) ) / 86400000))}
                                    {hw === 0 && <p className={`${style.status} ${style.yellow}`}>Not started</p>}
                                    {Math.floor(( Date.parse(endDate) - Date.parse(today) ) / 86400000) >= 0 && hw !== 0 && fww <= ww && <p className={`${style.status} ${style.green}`}>On track</p>}
                                    {hw === h && Math.floor(( Date.parse(endDate) - Date.parse(today) ) / 86400000) < 0 && <p className={`${style.status} ${style.green}`}>Completed</p>}
                                    {hw !== 0 && hw !== h && Math.floor(( Date.parse(endDate) - Date.parse(today) ) / 86400000) < 0 && <p className={`${style.status} ${style.red}`}>Not Completed</p>}
                                    {hw !== 0 && Math.floor(( Date.parse(endDate) - Date.parse(today) ) / 86400000) >= 0 && fww > ww && (fww - ww) < (fww * 0.1) && <p className={`${style.status} ${style.yellow}`}>Behind schedule</p>}
                                    {hw !== 0 && Math.floor(( Date.parse(endDate) - Date.parse(today) ) / 86400000) >= 0 && fww > ww && (fww - ww) > (fww * 0.1) && <p className={`${style.status} ${style.red}`}>Needs overview</p>}
                                </div>
                                <div className={style.team}>
                                    <h4 className="mb-2">Team</h4>
                                    <div>
                                        {dataProjectLead && <div className={style.inlineUser}>
                                            <p className="p">{dataProjectLead.user.fname + " " + dataProjectLead.user.lname}</p>
                                            <p className="p">{"- Project Lead"}</p>
                                        </div>}
                                        {dataProjectMonitor && <div className={style.inlineUser}>
                                            <p className="p">{dataProjectMonitor.user.fname + " " + dataProjectMonitor.user.lname}</p>
                                            <p className="p">{"- Project Monitor"}</p>
                                        </div>}
                                        {dataU && dataU.membersInProject.map(user => (
                                            <div className={style.inlineUser}>
                                                <p className="p">{user.fname + " " + user.lname}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <PhaseOverview projectID={projectID} phaseID={data.project.currentPhase} project={data} edit={edit}/>
                        </div>
                    </div>
                </div>
            </Fade>
        )
    }

    return (
        <div>

        </div>
    )
}

export default Project;