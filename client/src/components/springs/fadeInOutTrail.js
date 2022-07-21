import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useTrail, animated, config } from 'react-spring'

function FadeInOutTrail(props) {
    const items = React.Children.toArray(props.children)
    const animation = useTrail(items.length, {
        config: config.gentle,
        opacity: props.show ? 1 : 0,
        x: props.show ? 0 : -20,
        from: {opacity: 0, x: -20},
    })

    return (
        <div>
            {animation.map((styles, index) => (
                <animated.div key={index} style={styles}>
                    <animated.div>{items[index]}</animated.div>
                </animated.div>
            ))}
        </div>
    )
}

export default FadeInOutTrail