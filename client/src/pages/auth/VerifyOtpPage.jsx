import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { PageTransition } from '../../components/PageTransition';
import { OtpVerificationCard } from '../../components/OtpVerificationCard';
import { getDefaultRouteForRole } from '../../utils/formatters';

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const initialEmail =
    location.state?.email || searchParams.get('email') || '';

  return (
    <PageTransition className="flex min-h-[calc(100vh-14rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <OtpVerificationCard
          email={initialEmail}
          onVerified={(user) => {
            navigate(getDefaultRouteForRole(user.role), { replace: true });
          }}
          onBack={() => navigate('/login')}
          backLabel="Back to Sign In"
        />
      </div>
    </PageTransition>
  );
}
