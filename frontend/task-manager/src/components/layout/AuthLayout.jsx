import React from 'react'
import UI_IMG from '../../assets/images/loginPageImage.jpg';
const AuthLayout = ({children}) => {
  return (
    <div className='flex'>
       <div className='w-screen h-screen md:w-[60vh] px-12 pt-8 pb-12'>
        <h2 className='text-lg font-medium text-black'>Task Manager</h2>
        {children}
        </div>

        <div className='hidden md:block w-[40vw] h-screen items-center bg-blue-50  bg-cover bg-no-repeat bg-center overflow-hidden p-8'>
            <img src={UI_IMG} alt="UI_IMG" className='w-64 lg:w-[90%]' />
        </div>
    </div>
  )
}

export default AuthLayout
 