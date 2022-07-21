import React from 'react';
import CreateTask from '../../components/createTask/createTask';
import ProjectPreview from '../../components/projectPreview/projectPreview';
import TaskList from '../../components/taskList/taskList';


function Test() {
    return (
        <div className="m-10">
            <CreateTask />
            <div className="ma">
                <TaskList />
            </div>
            <ProjectPreview
                progress={44}
                name={"Glede"}
                link={"/"}
            />
            <ProjectPreview
                progress={75}
                name={"Streetlight"}
                link={"/"}
            />
        </div>
    )
}

export default Test;