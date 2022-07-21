import React, {useContext} from 'react';
import { useMutation, useQuery } from '@apollo/client';
import UserContext from '../../components/context/userContext';
import { Link, useHistory } from 'react-router-dom';
import Footer from '../../components/footer/footer';
import SalesPoints from './../../components/salesPoints/salesPoints';
import style from './landingPage.module.css';
import jwt_decode from "jwt-decode";
import Cookies from 'universal-cookie';
import { logout, getUser } from '../../graphql/mutations/userMutations';

//workplace-settings

function LandingPage() {
    var {setUserID} = useContext(UserContext)
    let userLoggedin = useContext(UserContext).userID
    const history = useHistory()
    const cookies = new Cookies();
    let accessToken = cookies.get("accessToken")
    var decoded 
    if(accessToken) decoded= jwt_decode(accessToken);
    const timeNow = parseInt(new Date().getTime().toString().slice(0, 10));
    let loggedIn = false;
    if((decoded?.tokenExpiration - timeNow) > 0){ 
        loggedIn = true
    }
    const { data: dataU, loading: loadingU } = useQuery(getUser, {
        variables: { userID: userLoggedin },
        skip: !loggedIn, //if task is not choosen skip
    });

    const [Logout] =  useMutation(logout)
    return(
        <div>
            <div className={style.navbar}>
                <div className={style.navbarWrapper}>
                    <h3 className="ml-8 my-3">Taskflow</h3>
                    <div className={style.left}>
                        {dataU && <span className={ `${style.name} p`} >Hello, {dataU?.user.fname}</span>}
                        {!loggedIn && <Link className={`button ${style.buttonLogin}`} to="/login">login</Link>}
                        {loggedIn && <button className={`button ${style.buttonLogOut}`} onClick={() =>{
                            cookies.remove("accessToken")
                            cookies.remove("refreshToken")
                            setUserID("")
                            Logout()
                        }}>log out</button>}
                        
                    </div>
                </div>
            </div>
            <div >
                <div className={style.landingWrapper}>
                    <div className={style.landing}>
                        <h1 className={style.header}>Taskflow - a graphical approach to project management</h1>
                        {!loggedIn && <Link className={`button ma mt-12 ${style.actionButton}`}to="/login">Get started</Link>}
                        {loggedIn && <Link className={`button ma mt-12 ${style.actionButton}`}to="/workplace-settings">Launch</Link>}
                    </div>
                </div>
                <div className={style.landingBottom}></div>
            </div>
            <SalesPoints/>
            <Footer/>
        </div>
    )
}

export default LandingPage;