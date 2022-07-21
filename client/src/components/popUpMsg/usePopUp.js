import {useState} from 'react';

const usePopUp = () => {
  const[isShowing, setIsShowing] = useState(false)
  function toggle() {
    setIsShowing(!isShowing)
  }

  return{
    isShowing,
    toggle,
  }
}

export default usePopUp