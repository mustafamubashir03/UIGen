import { SignIn } from '@clerk/nextjs'


const SignInPage = () => {
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <section className='w-full max-w-md'>
        <SignIn
          appearance={{
            elements: {
              card: "shadow-none border-0 rounded-none",
              cardBox: "shadow-none border-0",
              formButtonPrimary:
                "bg-slate-900 hover:bg-slate-800 text-white rounded-md",
            },
          }}
        />
      </section>
    </div>
  )
}

export default SignInPage