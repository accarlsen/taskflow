import { useMutation } from '@apollo/client';
import React, { useState } from 'react';
import ErrorMessage from '../../../components/errorMessage/errorMessage';
import { getPhases, newPhase } from '../../../graphql/queries/project';
import style from './../project.module.css';

function AddPhase(props) {

    const projectID = window.location.href.split("/")[window.location.href.split("/").length - 1];

    const [edited, setEdited] = useState(false);
    const [active, setActive] = useState(false);
    const [name, setName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    //Error feedback
    const [noErrors, setNoErrors] = useState(false);
    const [startDateError, setStartDateError] = useState("")
    const [endDateError, setEndDateError] = useState("")
    const [nameError, setNameError] = useState("");

    //Checks if the given project-name already exists in the organization's project list
    const checkExistingNames = (name) => {
        let nameExists = false
        props.phases.map(phase => {
            if (name === phase.name) {
                nameExists = true;
                return
            }
        })
        return nameExists
    }

    const [NewPhase] = useMutation(newPhase, {
        variables: { projectID: projectID }
    })

    return (
        <div>
            {!active && <div className="ma my-10 mb-12">
                <button className="buttonGreen" onClick={() => { setActive(true) }}>{"Add phase"}</button>
            </div>}
            {active && <div className={`my-2 ${style.phaseEditWrapper}`}>
                <div className={`mt-4 ${style.phaseAddGrid}`}>
                    <div>
                        <div className={`mt-1 ${style.inlineD}`}>
                            <p className="p">{"Name: "}</p>
                            <div>
                                <input className={`input ${style.nameD}`} value={name} placeholder={"name..."}
                                    onChange={e => {
                                        setName(String(e.target.value));
                                        setEdited(true);
                                        let nameErrorT = true;
                                        if (String(e.target.value.replace(/\s/g, '')).length >= 3) {
                                            setNameError("")
                                            nameErrorT = false
                                        }

                                        //Check for all errors
                                        if (nameErrorT || startDateError !== "" || endDateError !== "" || startDate === "" || endDate === "") {
                                            setNoErrors(false)
                                        } else {
                                            setNoErrors(true)
                                        }
                                    }}
                                    onBlur={e => {
                                        let nameErrorT = false
                                        if (String(e.target.value.replace(/\s/g, '')).length < 3) {
                                            setNameError("Project name must be longer than 2 characters")
                                            nameErrorT = true;
                                        }
                                        else if (checkExistingNames(String(e.target.value))) {
                                            setNameError("There aleready exists a project with the same name")
                                            nameErrorT = true;
                                        }
                                        else setNameError("")

                                        //Check for all errors
                                        if (nameErrorT || startDateError !== "" || endDateError !== "" || startDate === "" || endDate === "") {
                                            setNoErrors(false)
                                        } else setNoErrors(true)
                                    }}></input>
                                <ErrorMessage errorMessage={nameError} />
                            </div>
                        </div>
                        <div className={`mt-1 ${style.inlineD}`}>
                            <p className="p my-1">{"Start date: "}</p>
                            <div>
                                <input type="date" className="input" value={startDate}
                                    onChange={e => {
                                        let startDateErrorT = true
                                        if (endDate === "" || e.target.value < endDate) {
                                            setStartDateError("")
                                            setStartDate(e.target.value)
                                            setEdited(true)
                                            startDateErrorT = false
                                        } else {
                                            setStartDateError("Start date must be before the end date")
                                            setStartDate("")
                                        }

                                        //Check for all errors
                                        if (nameError !== "" || startDateErrorT || endDateError !== "" || endDate === "") {
                                            setNoErrors(false)
                                        } else setNoErrors(true)
                                    }}></input>
                                <ErrorMessage errorMessage={startDateError} />
                            </div>
                        </div>
                        <div className={`my-1 ${style.inlineD}`}>
                            <p className="p my-1">{"End date: "}</p>
                            <div>
                                <input type="date" className="input" value={endDate}
                                    onChange={e => {
                                        let endDateErrorT = true
                                        if (startDate === "" || startDate < e.target.value) {
                                            setEndDateError("")
                                            setEndDate(e.target.value);
                                            setEdited(true)
                                            endDateErrorT = false
                                        } else {
                                            setEndDateError("End date must be after the start date")
                                            setEndDate("");
                                        }

                                        //Check for all errors
                                        if (nameError !== "" || startDateError !== "" || endDateErrorT || startDate === "") {
                                            setNoErrors(false)
                                        } else setNoErrors(true)
                                    }}></input>
                                <ErrorMessage errorMessage={endDateError} />
                            </div>
                        </div>
                    </div>
                    <div>
                    </div>
                    <div className={style.inlineB}>
                        <button className={`${edited && noErrors ? "buttonGreen" : "buttonInactive"} ma`} onClick={e => {
                            e.preventDefault();
                            if (edited && noErrors) {
                                NewPhase({
                                    variables: {
                                        name: name,
                                        projectID: projectID,
                                        startDate: startDate,
                                        endDate: endDate
                                    },
                                    refetchQueries: [{ query: getPhases, variables: { projectID: projectID } }]
                                });
                                setEdited(false);
                                setActive(false);
                                setName("");
                                setStartDate("");
                                setEndDate("");
                                setNameError("");
                                setStartDateError("");
                                setEndDateError("");
                            }
                        }}>{" Add "}</button>
                        <button className="buttonCancel ma" onClick={() => {
                            setActive(false);
                            setEdited(false);
                            setName("");
                            setStartDate("");
                            setEndDate("");
                            setNameError("");
                            setStartDateError("");
                            setEndDateError("");
                        }}>Cancel</button>
                    </div>
                </div>
            </div>}
        </div>
    )
}

export default AddPhase;