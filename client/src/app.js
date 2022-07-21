import React, { useState, useMemo } from 'react';
import UserContext from './components/context/userContext'
import './common.css'
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Redirect
} from "react-router-dom";
import PrivateRoute from './components/privateRoute/privateRoute';
import LandingPage from './pages/landingPage/landingPage';
import OrganizationSettings from './pages/organizationSettings/organizationSettings'
import Test from './pages/test/test';
import Sidebar from './components/sidebar/sidebar';
import Login from './pages/loginPage/login';
import NewOrgPage from './pages/newOrgPage/newOrgPage';
import UserOrgContext from './components/context/userOrgContext';
import jwt_decode from "jwt-decode";
import Cookies from 'universal-cookie';
import ProjectList from './pages/projectList/projectList';
import Project from './pages/project/project';
import PageNotFound from './components/pageNotFound/pageNotFound';
import MyTasks from './pages/myTasks/myTasks';
import AssignedTasks from './pages/assignedTasks/assignedTasks';
import AssigneeContext from './components/context/assigneeContext';
import RoadmapPage from './pages/roadmap/roadmapPage';
import {  renewToken } from '../src/graphql/mutations/userMutations'
import { useMutation } from '@apollo/client';


function App() {
    //Fetch token from cookie to know which user is logged in
    const cookies = new Cookies();
    var token = cookies.get("accessToken");
    var user = ""
    if (token != "" && token != null) {
        user = jwt_decode(token).userID;
    }
    var OrgToken = cookies.get("orgToken");
    var org = ""
    if (OrgToken != "" && OrgToken != null) {
        org = OrgToken;
    }
    
    

    // Default value here need to be set to "last used" or something like that
    const [orgID, setOrgID] = useState(org);
    //60253bc965b6f8d109b73fbb

    const orgProviderValue = useMemo(() => ({ orgID, setOrgID }), [orgID, setOrgID]);
    //set the user from cookie in userContext
    const [userID, setUserID] = useState(user);

    const userProviderValue = useMemo(() => ({ userID, setUserID }), [userID, setUserID]);
    // Assigned id context
    const [assignedID, setAssignedID] = useState(user)

    const assigneeProviderValue = useMemo(() => ({ assignedID, setAssignedID }), [assignedID, setAssignedID]);

    return (
        <UserContext.Provider value={userProviderValue}>
            <UserOrgContext.Provider value={orgProviderValue}>
                <Router>
                    <Switch>
                        <Route exact path="/"> <LandingPage /> </Route>
                        <Route exact path={"/login"}> <Login />  </Route>

                        <Route>
                            <div className="relative">
                                <Sidebar />
                                <div>
                                    <Switch>
                                        <PrivateRoute exact path={"/workplace-settings"} component={OrganizationSettings} />
                                        <PrivateRoute exact path={"/new-workplace"} component={NewOrgPage} />
                                        <PrivateRoute exact path={"/projects"} component={ProjectList} />
                                        <PrivateRoute exact path={"/new_project"} component={ProjectList} />
                                        
                                        <AssigneeContext.Provider value={assigneeProviderValue}>
                                            <PrivateRoute exact path={"/created-tasks"} component={MyTasks} />
                                            <PrivateRoute exact path={"/my-tasks"} component={AssignedTasks} />
                                            <PrivateRoute path={"/roadmap/"} component={RoadmapPage} />
                                            <PrivateRoute path={"/projects/"} component={Project} />
                                        </AssigneeContext.Provider>
                                        
                                        <Route path="/404" component={PageNotFound} />
                                        <Redirect to={"/404"} />
                                    </Switch>
                                </div>
                            </div>
                        </Route>
                    </Switch>
                </Router>
            </UserOrgContext.Provider>
        </UserContext.Provider>
    )
}

export default App