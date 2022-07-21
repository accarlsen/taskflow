import React from 'react';
import {useSpring, animated} from 'react-spring'
import CreateOrganization from '../../components/createOrganization/createOrganization';
import Fade from './../../components/springs/fadeInOutTrans'

function NewOrgPage() {

    return (
        <Fade show={true}>
            <CreateOrganization />
        </Fade>
    )
}

export default NewOrgPage