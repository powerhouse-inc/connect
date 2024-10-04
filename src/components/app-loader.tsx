import { lazy, Suspense } from 'react';

const LazyApp = lazy(() => import('./app.tsx'));

export default function AppLoader() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LazyApp />
        </Suspense>
    );
}
