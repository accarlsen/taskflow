import React from 'react';
import {Link} from 'react-router-dom';

import style from './salesPoints.module.css'

import TodoSVG from './todo.svg'
import SharingSVG from './assigning.svg'
import DataSVG from './data.svg'

function SalesPoints() {
    return(
        <div className={style.illustrations}>
                <div className={style.illustrationsWrapper}>
                    <img className={style.todoSVG} src={TodoSVG}></img>
                    <h2 className={style.illustrationsText}>Gather all projects in one place</h2>
                    <p className="p w90 mt-6">
                        Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                    <Link to="/"><p className="w90 a1">{"Read more  >"}</p></Link>
                </div>
                <div className={style.illustrationsWrapper}>
                    <img className={style.todoSVG} src={SharingSVG}></img>
                    <h2 className={style.illustrationsText}>Coordinate and follow up tasks across departments</h2>
                    <p className="p w90 mt-6">
                        Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                    <Link to="/"><p className="w90 a1 mt-4">{"Read more  >"}</p></Link>
                </div>
                <div className={style.illustrationsWrapper}>
                    <img className={style.todoSVG} src={DataSVG}></img>
                    <h2 className={style.illustrationsText}>Unleash the potential of your company's data</h2>
                    <p className="p w90 mt-6">
                        Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                    <Link to="/"><p className="w90 a1">{"Read more  >"}</p></Link>
                </div>
            </div>
    )
}

export default SalesPoints