import React from 'react';
import { Link } from 'react-router-dom';
import ProgressDonut from '../progressDonut/progressDonut';
import style from './projectPreview.module.css';


function ProjectPreview(props) {
    return (
        <Link className="a1" to={props.link}>
            <div className={style.wrapper}>
                <ProgressDonut
                    progress={props.progress}
                    size={100}
                    strokeWidth={14}
                    circleOneStroke='#3f3f3f'
                    circleTwoStroke='#09D28A'
                />
                <h4 className={style.title}>{props.name}</h4>
            </div>
        </Link>
    )

}

export default ProjectPreview;