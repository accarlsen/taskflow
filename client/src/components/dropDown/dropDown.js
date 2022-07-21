import { useMutation } from '@apollo/client';
import React, { useContext, useState } from 'react';
import { useSpring, animated } from 'react-spring'
import Cookies from 'universal-cookie';
import { setClaims } from '../../graphql/mutations/userMutations';
import UserOrgContext from '../context/userOrgContext';
import style from './dropDown.module.css';
import { useHistory } from 'react-router-dom';
import Fade from './../springs/fadeInOutTrans';
import jwt_decode from "jwt-decode";

function DropDown(props) {
    let history = useHistory();
    const [SetClaims] = useMutation(setClaims, {
        variables: {},
        onCompleted(accessData) {
            if (accessData) {
                cookies.set('accessToken', accessData?.setClaims?.accessToken, { path: '/' });
                cookies.set('refreshToken', accessData?.setClaims?.refreshToken, { path: '/' });
            }

        }
    })

    const cookies = new Cookies();
    const accessToken = cookies.get('accessToken');
    var decoded
    if (accessToken) decoded = jwt_decode(accessToken);
    const timeNow = parseInt(new Date().getTime().toString().slice(0, 10));

    const [showMenu, setShowMenu] = useState(false)

    const { orgID, setOrgID } = useContext(UserOrgContext)

    const dataO = props.orgs

    const rotate = useSpring({
        transform: showMenu ? 'rotate(90deg)' : 'rotate(0deg)'
    })

    const spring = useSpring({ to: { opacity: showMenu ? 1 : 0 } })

    return (
        <div className={style.wrapper}>
            <div className={style.dropdownWrapper} onClick={() => {
                if (showMenu) {
                    setShowMenu(false)
                } else {
                    setShowMenu(true)
                }
            }}>
                <animated.img style={rotate} className={style.elementIcon} src={props.imgLink}></animated.img>
                <span className={style.elementText}>{props.text}</span>
            </div>
            {dataO && showMenu && <div className={style.dropdownExpanse}>
                <Fade fromTop={true} leaveTop={true} show={showMenu}>

                    {dataO.userOrgs.filter(orgs => orgs.id !== orgID).map(orgs => (
                        <div className={style.dropdownWrapper} key={orgs.id}>
                            <button className={`${style.elementText} ml-4`} onClick={e => {
                                setOrgID(
                                    orgs.id,
                                )
                                if (decoded && decoded?.tokenExpiration > timeNow) {
                                    SetClaims({
                                        variables: {
                                            orgID: orgs.id,
                                        }
                                    })
                                }
                                setShowMenu(false)
                                cookies.set('orgToken', orgs.id, { path: '/' });
                                // Do something with this
                                history.push("/my-tasks");
                            }}>{orgs.name}</button>
                        </div>
                    ))}
                </Fade>

            </div>
            }
        </div>
    )
}

export default DropDown