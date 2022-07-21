import React from 'react';
import style from './footer.module.css';


function Footer() {
    return (
        <div>
            <div className={style.footerTopBackground}><div className={style.footerTop}></div></div>
            <div className={style.wrapper}>
                <div className={style.grid}>
                    <div>
                        <h3>Taskflow</h3>
                        <p className="p mt-2">register</p>
                        <p className="p mt-2">login</p>
                        <p className="p mt-2">favn</p>
                    </div>
                    <div className="right">
                        <h3>Contact</h3>
                        <p className="p mt-2">Mail: contact@favn.com</p>
                        <p className="p mt-2">Address: Kjøpmannsgata 59,</p>
                        <p className="p mt-2">7011 Trondheim</p>
                    </div>
                </div>
                <p className="p my-6">Powered by Favn</p>
            </div>
        </div>
    )
}

export default Footer;