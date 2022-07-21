import { useQuery } from '@apollo/client';
import React, { useContext, useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import UserOrgContext from '../../components/context/userOrgContext';
import ProjectPreview from '../../components/projectPreview/projectPreview';
import { getProjectPreviews } from './../../graphql/queries/project';
import NewProject from './components/newProject';
import style from './projectList.module.css';
import Fade from './../../components/springs/fadeInOutTrans'


function ProjectList() {
    const orgID = useContext(UserOrgContext)
    const [add, setAdd] = useState(false);

    const history = useHistory();

    const { data, loading, error } = useQuery(getProjectPreviews, {
        variables: orgID
    });

    const url = window.location.href.split("/")[window.location.href.split("/").length - 1];

    useEffect(() => {
        if (url === "new_project") {
            setAdd(true)
        } else {
            setAdd(false)
        }
        document.addEventListener("keydown", handleKeyDown)
        return () => {
            document.removeEventListener("keydown", handleKeyDown)
        }
    });

    const handleKeyDown = (event) => {
        if (event.key === "+") {
            setAdd(true)
            history.push("/new_project")
        }
        else if (event.key === "Escape") {
            setAdd(false)
            history.push("/projects")
        }
    }

    if (error) {
        console.log(error.message);
        return (
            <div onKeyDown={handleKeyDown} className={style.wrapper}>
                <div className={style.grid}>
                    <Fade show={true} fromBottom={true}><Link className="a1" to="/new_project"><div className={style.add}>
                        <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                            <rect y="45" width="100" height="10" rx="5" fill="#C4C4C4" />
                            <rect x="45" y="100" width="100" height="10" rx="5" transform="rotate(-90 45 100)" fill="#C4C4C4" />
                        </svg>
                        <h4 className="ma mt-4">{"Add project"}</h4>
                    </div></Link></Fade>
                </div>
            </div>
        )
    }
    if (loading) return <span>Loading...</span>
    if (data) {
        return (
            <Fade show={true}><div style={add ? { height: "100vh", overflow: "hidden" } : { overflow: "auto" }}>
                {add && <div className={style.background}>
                    <div className={style.filterColor}>
                        <NewProject projects={data.projects} />
                    </div>
                </div>}
                <div className={style.wrapper}>
                    <div className={style.grid}>
                        <Link className="a1 shadow" to="/new_project"><div className={style.add}>
                            <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                                <rect y="45" width="100" height="10" rx="5" fill="#C4C4C4" />
                                <rect x="45" y="100" width="100" height="10" rx="5" transform="rotate(-90 45 100)" fill="#C4C4C4" />
                            </svg>
                            <h4 className="ma mt-4">{"Add project"}</h4>
                        </div></Link>

                        {data.projects.map(data => {
                            let progress = 0;
                            if (!data.archived) {
                                if (data.weight !== 0) {
                                    progress = (data.progress / data.weight) * 100
                                }
                                return (
                                    <div key={data.id} className="shadow">
                                        <ProjectPreview
                                            link={"/projects/" + data.id}
                                            progress={progress}
                                            name={data.name}
                                        />
                                    </div>
                                )
                            }
                        })}
                    </div>
                </div>
            </div></Fade>
        )
    }
    return (
        <div className={style.wrapper}>
            <div className={style.grid}>
                <p className="ma p">Could not find any projects</p>

            </div>
        </div>
    )
}

export default ProjectList;