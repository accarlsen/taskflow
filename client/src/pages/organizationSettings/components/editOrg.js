import { useMutation } from '@apollo/client';
import React, { useContext, useState } from 'react';
import UserOrgContext from '../../../components/context/userOrgContext';
import style from './../organizationSettings.module.css';
import { updateOrg, userOrgs } from '../../../graphql/queries/orgs';


function EditOrg({ orgName, orgDescription }) {

    const orgID = useContext(UserOrgContext)
    const [name, setName] = useState(orgName);
    const [description, setDescription] = useState(orgDescription);
    const [isModified, setIsModified] = useState(false)
    const [nameError, setNameError] = useState("")

    const [UpdateOrg] = useMutation(updateOrg, {
        variables: orgID.orgID, name, description
    })

    if (orgID === "" || orgID === undefined || orgID === null) return (
        <p className="p p-2 m-2">{"No org id sat from token"}</p>
    )

    const handleKeyDown = (event) => {
        if(event.key === "Enter" && isModified && nameError === "") {
            updateOrgFunc(event)
        }
    }

    const updateOrgFunc = (e) => {
        e.preventDefault()
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
        setIsModified(false)
    }

    return (
        <div className="mt-6" onKeyDown={handleKeyDown}>
            <div className={style.inline}>
                <p className="p my-1">{"Name: "}</p>
                <input className={`input`} value={name} placeholder={"Name..."} 
                    onChange={e => {
                        setName(String(e.target.value));
                        setIsModified(true)
                        if (String(e.target.value.replace(/\s/g, '')).length >= 3) {
                            setNameError("")
                        }
                    }}
                    onBlur={e => {
                        if (String(e.target.value.replace(/\s/g, '')).length < 3) {
                            setNameError("Project name must be longer than 2 characters")
                        }
                        else setNameError("")
                    
                    }}></input>
            </div>
            <div>
                <p className="p my-1 mt-3">{"Description: "}</p>
                <textarea className={`input ${style.description}`} value={description} placeholder={"Description..."} onChange={e => { setDescription(String(e.target.value)); setIsModified(true) }}></textarea>
            </div>
            <div className={`mt-4 ${style.inlineButtons}`}>
                <button className={name.length >= 2 && isModified ? "buttonGreen" : "buttonInactive"} onClick={e => {
                    e.preventDefault();
                    if (nameError === "" && isModified) {
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
                        setIsModified(false)
                    }
                }
                }>Update</button>
            </div>
        </div >
    )
}

export default EditOrg;