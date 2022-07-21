import React from 'react';
import style from './popUpMsg.module.css';
import ReactDOM from 'react-dom'

const PopUpMsg = ({isShowing, hide, msg}) => isShowing ? ReactDOM.createPortal(
    <div className={style.wrapper} aria-modal>
        <div className="modal">
            <div className={style.header}>
                <div className={style.inline}>
                    <p className={`p mt-2 ml-2 ${style.text}`}>{msg}</p>
                    <button onClick={hide} className={style.closeButton} aria-label="Close" data-dismiss="modal">
                        <span className={style.text} aria-hidden="true">&times;</span>
                    </button>
                </div>
                <button 
                    className={style.dontShowButton} 
                    onClick={() => {localStorage.setItem("showPopUp", false);}} >
                    <span className={`p ml-2 mb-2 ${style.text2}`}>Dont Show Again
                    {/*
                    {(localStorage.getItem("showPopUp") !== null || localStorage.getItem("showPopUp") !== undefined) 
                    && <svg className={style.doneCheckmark} viewBox="0 0 289 192" preserveAspectRatio="xMidYMid" width="289" height="192" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path stroke="#25D195" strokeWidth="35" d="M10.6066 61.3934L129.116 179.903M108.393 180.458L277.458 11.3934" />
                    </svg>}*/}
                    </span>
                </button>
            </div>  
        </div>
    </div>, document.body
) : null

export default PopUpMsg

    /*

    const spring = useSpring({
        config:{tension: 250, friction: 20, precision: 0.1, duration: 1000},
        to: async (next, cancel) => {
            await next({opacity: 1, height: '5%'})
            await next({opacity: 0, height: '5%'})
        },
        from: {opacity: 0, height: '15%'}

    })

    return(
        <animated.div style={spring} className={style.wrapper}>
            <animated.div className={style.innerWrapper} >
                <animated.div className={style.life}></animated.div>
                <p className={`p ${style.text}`}>{props.item}</p>
            </animated.div>
        </animated.div>
    )
    */