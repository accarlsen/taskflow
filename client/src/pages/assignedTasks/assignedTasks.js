import React, { useContext } from 'react';
import UserContext from '../../components/context/userContext';
import UserOrgContext from '../../components/context/userOrgContext';
import { useSpring, animated } from 'react-spring'
import { getAssignedTasks } from '../../graphql/queries/tasks';
import { useQuery } from '@apollo/client'
import TaskList from '../../components/taskList/taskList';
import style from './assignedTasks.module.css'
import Fade from './../../components/springs/fadeInOutTrans'

function AssignedTasks() {

    const userID = useContext(UserContext)

    const orgID = useContext(UserOrgContext)
    const { data: data0, loading: loading0, error: error0 } = useQuery(getAssignedTasks, {
        variables: { assignedID: userID.userID, orgID: orgID.orgID, archived: false, period: 0 },
        fetchPolicy: 'network-only'
    });
    const { data: data1, loading: loading1 } = useQuery(getAssignedTasks, {
        variables: { assignedID: userID.userID, orgID: orgID.orgID, archived: false, period: 1 },
        fetchPolicy: 'network-only'
    });
    const { data: data2, loading: loading2 } = useQuery(getAssignedTasks, {
        variables: { assignedID: userID.userID, orgID: orgID.orgID, archived: false, period: 2 },
        fetchPolicy: 'network-only'
    });
    const { data: data3, loading: loading3 } = useQuery(getAssignedTasks, {
        variables: { assignedID: userID.userID, orgID: orgID.orgID, archived: false, period: 3 },
        fetchPolicy: 'network-only'
    });

    /*if (loading0 || loading1 || loading2 || loading3) return (
        <div className="ml-20 mt-16">
            <span className="ml-20 mt-16 p">Loading...</span>
        </div>
    )*/

    if (error0) console.log("error: ", error0.message);

    if (data0 && data1 && data2 && data3) return (
        <div className="ma">
            <Fade show={true}>
                <h1 className="ma mt-10 mb-6">My Tasks</h1>
                {data0.tasksAssigned.length > 0 && <div className={style.wrapperWrapper}>
                    <h4 className={`ma mt-2 mb-4`}>{"Overdue: "}</h4>
                    <TaskList data={data0.tasksAssigned} userID={userID.userID} period={0} members={null} />
                </div>}
                {data1.tasksAssigned.length > 0 && <div className={style.wrapperWrapper}>
                    <h4 className={`ma mt-2 mb-4`}>{"Today: "}</h4>
                    <TaskList data={data1.tasksAssigned} userID={userID.userID} period={1} members={null} />
                </div>}
                {data2.tasksAssigned.length > 0 && <div className={style.wrapperWrapper}>
                    <h4 className={`ma mt-2 mb-4`}>{"Tomorrow: " }</h4>
                    <TaskList data={data2.tasksAssigned} userID={userID.userID} period={2} members={null} />
                </div>}
                {data3.tasksAssigned.length > 0 && <div className={style.wrapperWrapper}>
                    <h4 className={`ma mt-2 mb-4`}>{"Next 7 days: "}</h4>
                    <TaskList data={data3.tasksAssigned} userID={userID.userID} period={3} members={null} />
                </div>}
                {(data0.tasksAssigned.length === 0 && data1.tasksAssigned.length === 0 && data2.tasksAssigned.length === 0 && data3.tasksAssigned.length === 0) && <div className={style.wrapperWrapperNoTask}>
                    <h4 className={'ma p border-b'}>No current assignments, check in with your project lead.</h4>
                </div>}
            </Fade>
        </div>
    )
    return (
        <div className="ma">
            {/*<p className="ma mb-8 mt-8 p p-2 border-b fsize-30">No data</p>*/}
        </div>
    )
}

export default AssignedTasks