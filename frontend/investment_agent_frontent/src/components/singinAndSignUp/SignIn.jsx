import { SignIn } from '@clerk/react';

const SignInPage = () => {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        }}>
            <SignIn
                fallbackRedirectUrl="/home"
                signUpUrl="/sign-up"
            />
        </div>
    );
};

export default SignInPage;
