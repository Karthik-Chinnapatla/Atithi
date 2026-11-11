import { Link } from 'react-router-dom';
import { Home, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDefaultRouteForRole } from '../utils/formatters';
import { PageTransition } from '../components/PageTransition';

export function UnauthorizedPage() {
  const { user } = useAuth();
  const homePath = user ? getDefaultRouteForRole(user.role) : '/';

  return (
    <PageTransition className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="card-surface max-w-md p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
          <ShieldAlert size={28} />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
          403 Forbidden
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
          Access restricted
        </h1>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
          Your current account role does not have permission to view this page.
        </p>
        <Link to={homePath} className="btn-primary mt-6">
          <Home size={16} />
          Go to Your Dashboard
        </Link>
      </div>
    </PageTransition>
  );
}
