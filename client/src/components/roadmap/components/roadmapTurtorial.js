import React, { useState, useEffect } from 'react';
import style from './roadmapTurtorial.module.css';
import Fade from './../../springs/fadeInOutTrans'

function RoadmapTurtorial() {
    const [isMinimized, setIsMinimized] = useState(true);


    const handleKeyDown = (event) => {
        if(event.key === "Escape" && !isMinimized) {
            setIsMinimized(true)
            localStorage.setItem("tutorialOpen", false)
        }
    }

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown)
        return () => {
            document.removeEventListener("keydown", handleKeyDown)
        }
    });


    if (!isMinimized) {
        return (
            <div className={style.background} onKeyDown={handleKeyDown}>
                <Fade show={!isMinimized} fromBottom={true}>
                    <div className={style.filterColor}>
                        <div className={style.shortcutsGuideWrapper}>
                            <button className={`p exitButton`} onClick={() => { setIsMinimized(true); localStorage.setItem("tutorialOpen", false)}}>X</button>
                            <h3 className="my-2">{"Roadmap Guide" }</h3>
                            <div className="my-2">
                                <h4>Connect tasks:</h4>
                                <p className="p my-1">To connect two tasks, left click one of the connection points(circles) on the side of a task, drag the line to a connection point (circle) on the opposite side of another task, and unpress left mousekey.</p>
                            </div>
                            <div className="my-2">
                                <h4>Fast connect tasks: Ctrl + Left Click</h4>
                                <p className="p my-1">Shortcut to connect to tasks: press and hold Ctrl, left click on source task and then left click on target task.</p>
                            </div>
                            <div className="my-2">
                                <h4>Remove connection between tasks:</h4>
                                <p className="p my-1">Left Click on the connection, then click Delete</p>
                            </div>
                            <div className="my-2">
                                <h4>Center camera:</h4>
                                <p className="p my-1">Click the square in the bottom-left menu.</p>
                            </div>
                            <div className="my-2">
                                <h4>Select multiple tasks:</h4>
                                <p className="p my-1">Hold Shift, click and hold Left Mouse button and drag the cursor to select all tasks in an area.</p>
                            </div>
                        </div>
                    </div>
                </Fade>
            </div>
        )
    }
    else{
        return(
            <div className={style.wrapper}>
                <div className={style.infoIconWrapper}>
                    <button className={` button2`} onClick={() => {setIsMinimized(false); localStorage.setItem("tutorialOpen", true)}}>
                        {/*<span className={`${style.buttonText} p mt-4 ml-8`} >{"Shortcuts guide"}</span>*/}
                        Roadmap Guide
                    </button>
                </div>
            </div>
        )
    }
}

export default RoadmapTurtorial;