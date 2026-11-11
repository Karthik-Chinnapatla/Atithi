import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { PageTransition } from '../components/PageTransition';

export function NotFoundPage() {
  return (
    <PageTransition className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="card-surface max-w-md p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
          <Compass size={28} />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
          404 Error
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
          The page you are looking for does not exist or may have been moved.
        </p>
        <Link to="/" className="btn-primary mt-6">
          <Home size={16} />
          Back to Discovery
        </Link>
      </div>
    </PageTransition>
  );
}
