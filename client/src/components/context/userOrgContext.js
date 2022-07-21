import { createContext } from 'react'
import Cookies from 'universal-cookie';


const cookies = new Cookies();

var OrgToken = cookies.get("orgToken");
var org = ""
if(OrgToken !== "" && OrgToken !== null){
    org = OrgToken;
}

const UserOrgContext = createContext(org)


export default UserOrgContext