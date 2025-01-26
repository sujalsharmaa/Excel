import { useEffect } from 'react';
// import { useRouter } from 'next/router';
import { LoginButton } from '../components/LoginButton';
import {useAuthStore} from '../Store/useStore.js';

export const  Login = ()=> {
//   const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
    //   router.push('/');
    console.log("push to home page")
    }
  }, [isLoading, isAuthenticated]);

  return (
    <div className="">
      <div className="">
        <LoginButton />
      </div>
    </div>
  );
}
