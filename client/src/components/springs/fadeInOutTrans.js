import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useTrail, animated, config, useTransition } from 'react-spring'

function FadeInOutTrans(props) {
    const items = React.Children.toArray(props.children)
    const show = props.show
    const fromTop = props.fromTop
    const fromLeft = props.fromLeft
    const fromRight = props.fromRight
    const fromBottom = props.fromBottom
    const leaveUp = props.leaveUp
    const leaveRight = props.leaveRight
    const leaveBottom = props.leaveBottom
    const leaveLeft = props.leaveleft
    const spring = useTransition(show, {
        from:{opacity: 0, transform: fromLeft ? "translate3d(-25%, 0px, 0px)" : fromBottom ? "translate3d(0px, 25%, 0px)" : fromRight ? "translate3d(25%, 0px, 0px)" : fromTop ? "translate3d(0px, -25%, 0px)" : ""},
        enter:{opacity: 1, transform: fromLeft ? "translate3d(0%, 0px, 0px)" : fromBottom ? "translate3d(0px, 0%, 0px)" : fromRight ? "translate3d(0%, 0px, 0px)" : fromTop ? "translate3d(0px, 0%, 0px)" : ""},
        leave:{opacity: 0, transform: leaveUp ? "translate3d(0px, -25%, 0px)" : leaveBottom ? "translate3d(0px, 25%, 0px)" : leaveLeft ? "translate3d(-25%, 0px, 0px)" : leaveRight ? "translate3d(25%, 0px, 0px)" : ""},
        reverse:show,
    })

    return spring(
        (styles, item) => item &&
        <animated.div style={styles}>{items}</animated.div>
    )
}

export default FadeInOutTrans