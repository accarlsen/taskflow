import { useQuery, useMutation } from '@apollo/client';
import React, { useContext, useEffect } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import Cookies from 'universal-cookie';
import { setClaims, logout } from '../../graphql/mutations/userMutations';
import UserContext from '../context/userContext';
import UserOrgContext from '../context/userOrgContext';
import { userOrgs } from './../../graphql/queries/orgs';
import DropDown from './../dropDown/dropDown';
import style from './sidebar.module.css';
import jwt_decode from "jwt-decode";



export default function Sidebar() {
    //Log out stuff
    var {setUserID} = useContext(UserContext)
    let history = useHistory();
    const cookies = new Cookies();

    let ownerCheck = cookies.get("accessToken")
    var decoded 
    if(ownerCheck) decoded= jwt_decode(ownerCheck);

    //Fetch orgs
    var {orgID, setOrgID} = useContext(UserOrgContext)
    const location = useLocation();
    
    const userLoggedIn = useContext(UserContext).userID
    const {  data } = useQuery(userOrgs, {
        variables: {userLoggedIn:userLoggedIn},
        skip: userLoggedIn===""
    });
    
    const timeNow = parseInt(new Date().getTime().toString().slice(0, 10));

    const [SetClaims] =  useMutation(setClaims, {
        variables: {},
        onCompleted(accessData) {
            if(accessData){
                cookies.set('accessToken', accessData?.setClaims?.accessToken, { path: '/' });
                cookies.set('refreshToken', accessData?.setClaims?.refreshToken, { path: '/' });
            }
        }
    })

    const [Logout] =  useMutation(logout)
    
    if(data && orgID==="" && data.userOrgs !== null && data?.userOrgs?.length>0){
        //console.warn("sat orgID to first org because the user does not have an org")  && !cookies.get("orgToken")
        cookies.set('orgToken', data.userOrgs[0].id, { path: '/' });
        setOrgID( data.userOrgs[0].id )
    }else if( cookies.get('orgToken') && (decoded?.owner=== undefined|| decoded?.owner=== null) &&  decoded && decoded?.tokenExpiration > timeNow){
        SetClaims({variables:{ orgID: cookies.get('orgToken') } })
    }else if(orgID !== "" && (decoded?.owner=== undefined || decoded?.owner=== null) &&  decoded && decoded?.tokenExpiration > timeNow){
        SetClaims({variables:{ orgID: orgID } })
    }

    useEffect(() => {
        
    }, [location])
    
    
    //if(loading) return <span>Loading...</span>
    //if(error) console.log("error: ", error.message);

    if(data && (decoded?.admin === 1 || decoded?.owner === 1 || !decoded)){
        return (
            <div className={style.sidebarWrapper}>
            {data.userOrgs.filter(orgs => orgs.id === orgID).map(org => (
                <h3 key={org.id} className={style.sidebarTitle}>{org.name}</h3>))}
                <SidebarElement
                    text="Workplace Settings"
                    imgLink=""
                    linkTo={"/workplace-settings"}/>
                <DropDown 
                    text="Switch Workplace"
                    imgLink="https://icon-library.com/images/arrow-icon-white/arrow-icon-white-29.jpg"
                    orgs={data }
                /> 
                <SidebarElement
                    text="Projects"
                    imgLink=""
                    linkTo={"/projects"} />
                <SidebarElement
                    text="My Tasks"
                    imgLink=""
                    linkTo={"/my-tasks"}/>
                <SidebarElement
                    text="Created Tasks"
                    imgLink=""
                    linkTo={"/created-tasks"}/>
                {/*<SidebarElement
                    text="My Reminders"
                    imgLink=""
                linkTo="/reminders"/>*/}
                <SidebarElement
                    text="New Workplace"
                    imgLink=""
                    linkTo={"/new-workplace"} />
                <button className={`mt-2 ${style.elementWrapper} ${style.elementWrapperUnselected}`}
                onClick={()=>{
                    cookies.remove("accessToken")
                    cookies.remove("refreshToken")
                    Logout()
                    setUserID("")
                    history.push("/");
                    }}>
                    <img className={style.elementIcon} src="https://dynastybusinessconsulting.com/wp-content/uploads/2018/07/exit-icon.png"></img>
                    <span className={style.elementText}>Log out</span>
                </button>
            </div>
        )
    }else if(data){
        return (
            <div className={style.sidebarWrapper}>
            {data.userOrgs.filter(orgs => orgs.id === orgID).map(org => (
                <h3 key={org.id} className={style.sidebarTitle}>{org.name}</h3>))}
                <DropDown 
                    text="Switch Workspace"
                    imgLink="https://icon-library.com/images/arrow-icon-white/arrow-icon-white-29.jpg"
                    orgs={data }
                /> 
                <SidebarElement
                    text="Projects"
                    imgLink=""
                    linkTo={"/projects"} />
                <SidebarElement
                    text="My Tasks"
                    imgLink=""
                    linkTo={"/my-tasks"}/>
                <SidebarElement
                    text="Created Tasks"
                    imgLink=""
                    linkTo={"/created-tasks"}/>
                {/*<SidebarElement
                    text="My Reminders"
                    imgLink=""
                linkTo="/reminders"/>*/}
                <SidebarElement
                    text="New Workplace"
                    imgLink=""
                    linkTo={"/new-workplace"} />
                    
                <button className={`${style.elementWrapper} ${style.elementWrapperUnselected}`}
                onClick={()=>{
                    cookies.remove("accessToken")
                    cookies.remove("refreshToken")
                    setUserID("")
                    Logout()
                    history.push("/");
                    }}>
                    <img className={style.elementIcon} src="https://library.kissclipart.com/20190828/ttq/kissclipart-exit-icon-essential-set-icon-9f169d73eae61289.png"></img>
                    <span className={style.elementText}>Log out</span>
                </button>
            </div>
        )
    }
    return (
        <div className={style.sidebarWrapper}>
            <h3 className={style.sidebarTitle}>Choose Workspace</h3>
            
            <DropDown 
                text="Switch Workspace"
                imgLink="https://icons-for-free.com/iconfiles/png/512/arrow+right+chevron+chevronright+right+right+icon+icon-1320185732203239715.png"/> 
            
            <SidebarElement
                text="New Workplace"
                imgLink=""
                linkTo={"/new-workplace"} />
        </div>
    )
}

const SidebarElement = (props) => {
    if (props.linkTo.slice(1) === window.location.href.split("/")[3]) { //window.location.href.split("/").length - 1]) {
        return (
            <Link className={`${style.neutralLink} w-full`} to={props.linkTo}>
                <div className={`${style.elementWrapper} ${style.elementWrapperSelected}`}>
                    {props.imgLink.length > 1 && <img className={style.elementIcon} src={props.imgLink}></img>}
                    <span className={style.elementText}>{props.text}</span>
                </div>
            </Link>
        )
    } 
    return (
        <Link className={`${style.neutralLink} w-full`} to={props.linkTo}>
            <div className={`${style.elementWrapper} ${style.elementWrapperUnselected}`}>
                {props.imgLink.length > 1 && <img className={style.elementIcon} src={props.imgLink}></img>}
                <span className={style.elementText}>{props.text}</span>
            </div>
        </Link>
    )
}