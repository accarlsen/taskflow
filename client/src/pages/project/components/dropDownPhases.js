import { useQuery } from '@apollo/client';
import React, { useState } from 'react';
import { getPhases } from '../../../graphql/queries/project';
import style from './../project.module.css';


function DropDownPhases() {
    const [dropDown, setDropDown] = useState(true);
    const { data } = useQuery(getPhases)

    if (data) {
        console.log(data)
        return (
            <div>
                {!dropDown && <div className={style.dropDownWrapper}>
                    <div className={style.dropDownCurrent}>
                        <span className={style.dropDownText}>{data.phases[0].name}</span>
                    </div>
                </div>}
                {dropDown && <div className={style.dropDownWrapper}>
                    {data.phases.map(data => (
                        <div key={data.id} className={style.dropDownOption}>
                            <span className={style.dropDownText}>{data.name}</span>
                        </div>
                    ))}
                </div>}
            </div>
        )
    }
    return (
        <div></div>
    )
}

export default DropDownPhases;