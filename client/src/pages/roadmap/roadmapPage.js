import React, { useEffect } from 'react';
import { getTasksInPhase } from '../../graphql/queries/tasks'
import { useQuery } from '@apollo/client'
import Roadmap from '../../components/roadmap/roadmap';

function RoadmapPage(props) {
    const phaseID = window.location.href.split("/")[window.location.href.split("/").length - 1];
    const {data, loading}= useQuery(getTasksInPhase, {
        variables: {
            phaseID:phaseID ? phaseID :  props?.phaseID  ///TODO props?.phaseID  phaseID ? phaseID : 
        },
    });
    useEffect(()=>{},[data,loading])

        return(
            <div className={`ma`}>
                <Roadmap props={data} showSidebar={true} editable={true} phaseID={phaseID}></Roadmap>
            </div>
        )
}

export default RoadmapPage