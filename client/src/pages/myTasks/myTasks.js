import { useQuery, useLazyQuery } from '@apollo/client';
import React, { useContext, useState } from 'react';
import { useSpring, animated } from 'react-spring'
import ArchivedList from '../../components/archivedList/archivedList';
import UserContext from '../../components/context/userContext';
import UserOrgContext from '../../components/context/userOrgContext';
import CreateTask from '../../components/createTask/createTask';
import TaskList from '../../components/taskList/taskList';
import { getMembersInOrgID } from '../../graphql/queries/orgs';
import { getAuthorsTasks } from '../../graphql/queries/tasks';
import style from './myTasks.module.css';
import Fade from './../../components/springs/fadeInOutTrans'

function MyTasks() {

    const userID = useContext(UserContext)

    const orgID = useContext(UserOrgContext)

    const [archived, setArchived] = useState(false)

    const { data: dataF } = useQuery(getMembersInOrgID, {
        variables: { orgID: orgID.orgID }
    })

    const { data: data0 } = useQuery(getAuthorsTasks, {
        variables: { authorID: userID.userID, orgID: orgID.orgID, archived: false, period: 0 },
        fetchPolicy: 'network-only'
    });
    const { data: data1 } = useQuery(getAuthorsTasks, {
        variables: { authorID: userID.userID, orgID: orgID.orgID, archived: false, period: 1 },
        fetchPolicy: 'network-only'
    });
    const { data: data2 } = useQuery(getAuthorsTasks, {
        variables: { authorID: userID.userID, orgID: orgID.orgID, archived: false, period: 2 },
        fetchPolicy: 'network-only'
    });
    const { data: data3 } = useQuery(getAuthorsTasks, {
        variables: { authorID: userID.userID, orgID: orgID.orgID, archived: false, period: 3 },
        fetchPolicy: 'network-only'
    });

    if (data0 && data1 && data2 && data3) return (
        <div className={`ma `}>
            <Fade show={true}>
                <h1 className="ma mt-10 mb-6">Created Tasks</h1>
                {(data0.tasksByAuthor.length === 0 && data1.tasksByAuthor.length === 0 && data2.tasksByAuthor.length === 0 && data3.tasksByAuthor.length === 0) && <div className={style.wrapperWrapperNoTask}>
                    <h4 className={'ma p border-b'}>You have no tasks, click on the Add Task button to start planning.</h4>
                </div>}
                <div className="my-3"><CreateTask orgTag={true} /></div>
                {data0.tasksByAuthor.length > 0 && <div className={style.wrapperWrapper}>
                    <h4 className={`ma mt-2 mb-4`}>{"Overdue: "}</h4>
                    <TaskList data={data0.tasksByAuthor} userID={userID.userID} period={0} members={dataF} />
                </div>}
                {data1.tasksByAuthor.length > 0 && <div className={style.wrapperWrapper}>
                    {console.log(data1.tasksByAuthor)}
                    <h4 className={`ma mt-2 mb-4`}>{"Today: "}</h4>
                    <TaskList data={data1.tasksByAuthor} userID={userID.userID} period={1} members={dataF} />
                </div>}
                {data2.tasksByAuthor.length > 0 && <div className={style.wrapperWrapper}>
                    {console.log(data2.tasksByAuthor)}
                    <h4 className={`ma mt-2 mb-4`}>{"Tomorrow: " }</h4>
                    <TaskList data={data2.tasksByAuthor} userID={userID.userID} period={2} members={dataF} />
                </div>}
                {data3.tasksByAuthor.length > 0 && <div className={style.wrapperWrapper}>
                    {console.log(data3.tasksByAuthor)}
                    <h4 className={`ma mt-2 mb-4`}>{"Next 7 days: " }</h4>
                    <TaskList data={data3.tasksByAuthor} userID={userID.userID} period={3} members={dataF} />
                </div>}
                {/*<div className={style.wrapperPre}>
                    <button className={`${style.button} mt-4 mb-4`} onClick={e => {
                        TasksArchived({ variables: { authorID: userID.userID, orgID: orgID.orgID, archived: true } })
                        SubtasksArchived({ variables: { authorID: userID.userID, orgID: orgID.orgID, archived: true } })
                        if (archived) {
                            setArchived(false)
                        } else {
                            setArchived(true)
                        }
                    }}>
                        View archived tasks
                        </button>
                    <animated.div style={archivedSpring}>
                        {archived && !loadingA && !loadingSA ? <ArchivedList tasks={dataS} subtasks={dataT} /> : ''}
                    </animated.div>
                </div>*/}
            </Fade>
        </div>
    )
    return <div></div>
}

export default MyTasks