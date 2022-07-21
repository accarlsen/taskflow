import React, { useContext } from 'react';
import { useHistory} from 'react-router-dom';
import Cookies from 'universal-cookie';
import { useMutation } from '@apollo/client';
import { login } from '../../graphql/mutations/userMutations'
import { GoogleLogin } from 'react-google-login';
import UserContext from '../../components/context/userContext';
import jwt_decode from "jwt-decode";
import style from './login.module.css'
import {useSpring, animated} from 'react-spring'
import Fade from './../../components/springs/fadeInOutTrans'


const responseGoogle = (response) => {
    console.log("Google query failed")
}
//
function Login() {
    const {setUserID} = useContext(UserContext)
    let history = useHistory();

    const cookies = new Cookies()

    const [Login, { loading, error }] =  useMutation(login, {
        variables: {},
        onCompleted(data) {
            if (loading) console.log("Loading.....");
            cookies.set('accessToken', data.login.accessToken, { path: '/' , httpOnly:false});
            cookies.set('refreshToken', data.login.refreshToken, { path: '/', httpOnly:false});
            var token = data.login.accessToken ;
            var decoded = jwt_decode(token);
            setUserID(decoded.userID)
            history.replace("/my-tasks");
        }
    })

    if(error){
        console.log(error.message);
    }
    /*if(data){
        const timer = setTimeOut(() => {
            console.log("inside timer")
            var token = data.login?.refreshToken;

        }, 1000);
    }*/

    return (
        <div className="center">
            <Fade show={true} fromBottom={true}>
                <p className="p border-b fsize-30 mb-12">Welcome to TaskFlow</p>
                <div className={`${style.wrapper}`}>
                    <p className="p border-b p-2 mt-4 ml-19">Log in with Google</p>
                    <div className="m-16 ml-22-5">
                    <GoogleLogin
                        clientId="39852125172-d5svt47s768q7tdefes09up4oaebmcqv.apps.googleusercontent.com"
                        buttonText="Login"
                        theme="dark"
                        class='button'
                        onSuccess={(response) => {
                            Login({
                                variables: {
                                    gID: response.googleId,
                                    accessToken: response.accessToken,
                                    email: response.profileObj.email,
                                    fname: response.profileObj.givenName,
                                    lname: response.profileObj.familyName,
                                    image: response.profileObj.imageUrl
                                }
                            });
                        }}
                        onFailure={responseGoogle}
                        cookiePolicy={'single_host_origin'}
                    />
                    </div>
                </div>
            </Fade>
        </div>
    )
}

export default Login;
