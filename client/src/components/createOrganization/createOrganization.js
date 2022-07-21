import { useMutation } from '@apollo/client';
import React, { useContext, useState } from 'react';
import {useSpring, animated} from 'react-spring'
import Cookies from 'universal-cookie';
import { setClaims } from '../../graphql/mutations/userMutations';
import { createOrganization, userOrgs } from '../../graphql/queries/orgs';
import UserOrgContext from '../context/userOrgContext';
import style from './createOrganization.module.css';
import { useHistory } from 'react-router-dom';
import jwt_decode from "jwt-decode";



function CreateOrganization() {
    
    const cookies = new Cookies();
    
    const accessToken = cookies.get('accessToken');
    var decoded 
    if(accessToken) decoded= jwt_decode(accessToken);
    const timeNow = parseInt(new Date().getTime().toString().slice(0, 10));
    
    const history = useHistory();

    const [active, setActive] = useState(true);

    const [name, setName] = useState("");

    const [description, setDescription] = useState("");

    const { setOrgID } = useContext(UserOrgContext)

    const [NewOrg, { error }] = useMutation(createOrganization, {
        variables: { name, description },
        onCompleted (data){
            console.log("oncompleted",data.createOrganization.id)
            setOrgID(data.createOrganization.id)
            if(decoded && decoded?.tokenExpiration > timeNow){
                SetClaims({
                    variables: {
                        orgID: data.createOrganization.id ,
                    }
                })
            }
            
            cookies.set('orgToken', data.createOrganization.id, { path: '/' });
        }
    })
    const [SetClaims, { loading: loadingC }] =  useMutation(setClaims, {
        variables: {},
        onCompleted(accessData) {
            if (loadingC) console.log("Loading.....");
            if(accessData){
                cookies.set('accessToken', accessData?.setClaims?.accessToken, { path: '/' });
                cookies.set('refreshToken', accessData?.setClaims?.refreshToken, { path: '/' });
            }
            
        }
    })

    const spring = useSpring({to: {opacity: active ? 1 : 0}, leave: {opacity: 0}})

    const handleKeyDown = (event) => {
        if(event.key === "Enter" && String(name.length) >= 2) {
            createOrg(event)
        }
    }

    const createOrg = (event) => {
        event.preventDefault();
        NewOrg({
            variables: {
                name: name,
                description: description,
            },
            refetchQueries: 
            [
                { query: userOrgs }
            ]
        });
        setName("");
        setActive(false);
        history.push("/organizationSettings")
    }

    if(error){
        console.log(error.message);
    }
    return ( //else - expanded
        <animated.div style={spring}>
            <div className={`${style.wrapper}`} onKeyDown={handleKeyDown}>
                <h4>{"Create a new workplace"}</h4>
                <input className={`my-2 input ${style.name}`} maxLength={40} value={name} placeholder={"name..."} autoFocus={true} onChange={e => { setName(String(e.target.value)); }}></input>
                <textarea className={`my-2 input ${style.description}`} maxLength={200} value={description} placeholder={"description..."} autoFocus={false} onChange={e => { setDescription(String(e.target.value)); }}></textarea>
                <div className={style.innerWrapper}>
                    <button 
                        className={`my-2 ${name.length >= 2 ? "buttonGreen" : "buttonInactive"}`} 
                        onClick={e => {
                            e.preventDefault(); //changes default behaviour
                            console.log(name.length)
                            if(name.length < 2) {
                                return
                            }
                            NewOrg({
                                variables: {
                                    name: name,
                                    description: description,
                                },
                                refetchQueries: 
                                [
                                    { query: userOrgs }
                                ]
                            });
                            setName("");
                            setActive(false);
                            history.push("/workplace-settings")
                        }
                    }>Create</button>
                </div>
            </div>
        </animated.div>
    )
}

export default CreateOrganization;