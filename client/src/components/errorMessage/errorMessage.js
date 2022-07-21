import React, { useState } from 'react';
import style from './errorMessage.module.css';

function ErrorMessage(props) {
    const [isMinimized, setIsMinimized] = useState(false);

    if (props.errorMessage === "") {
        return <div></div>
    }
    else if (!isMinimized) {
        return (
            <div className={style.wrapper}>
                <div className={style.errorMessageWrapper}>
                    <div className={style.triangle}></div>
                    <div className={style.messageBox}>
                        <span className="p">{props.errorMessage}</span>
                        <button className="p" onClick={() => {setIsMinimized(true)}}>{"x"}</button>
                    </div>
                </div>
            </div>
        )
    }
    else{
        return(
            <div className={style.wrapper}>
                <div className={style.errorIconWrapper}>
                    <span className={`${style.errorIcon} p`} onClick={() => {setIsMinimized(false)}}>{"!"}</span>
                </div>
            </div>
        )
    }
}

export default ErrorMessage;