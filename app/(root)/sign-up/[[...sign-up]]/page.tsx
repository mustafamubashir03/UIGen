import { SignUp } from '@clerk/nextjs'
import React from 'react'

const SignUpPage = () => {
  return (
    <div className='flex min-h-screen max-w-md mx-auto items-center justify-center w-full px-4'>
      <section className='w-full flex justify-center'>
        <SignUp />
      </section>
    </div>
  )
}

export default SignUpPage