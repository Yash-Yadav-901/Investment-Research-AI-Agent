import { SignUp } from '@clerk/react';

const SignUpPage = () => {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        }}>
            <SignUp
                fallbackRedirectUrl="/home"
                signInUrl="/sign-in"
            />
        </div>
    );
};

export default SignUpPage;
