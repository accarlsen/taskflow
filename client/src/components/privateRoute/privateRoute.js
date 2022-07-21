import React, { useContext, useEffect, useState } from 'react';
import { Redirect, Route } from 'react-router-dom';
import UserContext from '../context/userContext';
import {  renewToken } from '../../graphql/mutations/userMutations'
import { useMutation } from '@apollo/client';
import Cookies from 'universal-cookie';
import jwt_decode from "jwt-decode";



const PrivateRoute = ({...rest}) => {
    const [Renewtoken] =  useMutation(renewToken, {
        variables: {},
        onCompleted(accessData) {
            if(accessData){
                cookies.set('accessToken', accessData?.renewToken?.accessToken, { path: '/' });
                cookies.set('refreshToken', accessData?.renewToken?.refreshToken, { path: '/' });
            }
            
        }
    })
    const cookies = new Cookies();
    const [time, setTime] = useState(1000000) // this is used to insue that timer runs inside useEffect
    var refreshToken = cookies.get("refreshToken");
    var accessToken = cookies.get("accessToken");
    var decoded
    if(accessToken) decoded = jwt_decode(accessToken);
    const timeNow = parseInt(new Date().getTime().toString().slice(0, 10));
    
    
    useEffect(() => {
        let timer = null
        if(refreshToken){
            /*global setTimeout*/
            //Call refresh token once the user calls a private route component
            var decodedRefresh = jwt_decode(refreshToken);
            if((decoded?.tokenExpiration - timeNow) < 1200 && decodedRefresh?.tokenExpiration > timeNow){ //if token has less than 20 minutes to be expired, refresh it (sure if the refresh token still valid)
                Renewtoken({
                    variables: {
                        refreshToken: refreshToken,
                    }
                })
            }

            //set timer which runs for first time after 7 minutes and so on..
            timer = window.setTimeout(function(){
                setTime(time-1)
                if((decoded?.tokenExpiration - timeNow) < 1200 && decodedRefresh?.tokenExpiration > timeNow){ //if token has less than 20 minutes to be expired, refresh it (sure if the refresh token still valid)
                    Renewtoken({
                        variables: {
                            refreshToken: refreshToken,
                        }
                    })
                }
            }, 1000 * 60 * 7);  //This will run after 7 minutes
            
            
        }
        return () => {
            //clear timer one the component is unmounted
            clearTimeout(timer);
        }
    }, [time]);
    
    
   
    const userContext = useContext(UserContext);
    
    if(!userContext.userID || decoded?.tokenExpiration < timeNow) { //isNotAuthenticated
         return <Redirect to={"/login"} />
    } else {
        return <Route {...rest} />;
    }
}

export default PrivateRoute;