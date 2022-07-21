import { useMutation } from '@apollo/client';
import React, { useContext, useState } from 'react';
import { updateOrg, userOrgs } from '../../graphql/queries/orgs';
import UserOrgContext from '../context/userOrgContext';
import style from './editOrg.module.css';
import {useSpring, animated} from 'react-spring'


function EditOrg( {imgLink, orgName, orgDescription} ) {

    const orgID = useContext(UserOrgContext)

    const [active, setActive] = useState(false);

    const [name, setName] = useState(orgName);

    const [description, setDescription] = useState(orgDescription);

    const [UpdateOrg, { errord }] = useMutation(updateOrg, {
        variables: orgID.orgID, name, description
    })

    const spring = useSpring({to: {opacity: active ? 1 : 0}})

    if(orgID == "" || orgID == undefined || orgID == null) return (
        <p> </p>
    )

    if (!active) return ( //default - retracted
        <div className={`${style.ma} ma mb-4`}>
            <button className={`button mb-4 ${style.ma}`} onClick={() => setActive(true)}>
                <img className={style.elementIcon} src={imgLink}></img>
                <span className={style.elementText}>Update Organization</span>
            </button>
        </div>
    )

    return ( //else - expanded
        <animated.div style={spring} className={`ma mb-4 ${style.outerWrapper}`} >
            <div className={style.wrapper}>
                <input className="m-2" value={name} autoFocus={true} placeholder={"Name..."} onChange={e => { setName(String(e.target.value)); }}></input>
                <textarea className="m-2" value={description} placeholder={"Description..."} autoFocus={false} onChange={e => { setDescription(String(e.target.value)); }}></textarea>
                <div className={style.innerWrapper}>
                    <button className="button2 m-2" onClick={()=>setActive(false)}>Cancel</button>
                    <button className="button2 m-2 c-forestgreen" onClick={e => {
                        e.preventDefault(); //changes default behaviour
                        if(name === "") {
                            alert("Please enter a name!")
                            return
                        } else if(description === "") {
                            alert("Please enter a description!")
                            return
                        }
                        UpdateOrg({
                            variables: {
                                orgID: orgID.orgID,
                                name: name,
                                description: description
                            },
                            refetchQueries: 
                            [
                                { query: userOrgs }
                            ]
                        });
                        setName("")
                        setDescription("")
                        setActive(false);
                    }
                    }>Update</button>
                </div>
            </div>
        </animated.div>
    )
}

export default EditOrg;