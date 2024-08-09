import { AnimatedLoader } from '@powerhousedao/design-system';
import { useInitialLoadingStatus } from 'src/hooks/useInitialLoadingStatus';
import { twMerge } from 'tailwind-merge';

export const LoadingScreen = () => {
    const loadingStatus = useInitialLoadingStatus();

    const showLoading = loadingStatus !== 'READY';

    return (
        <div
            className={twMerge(
                'absolute inset-0 z-10 flex items-center justify-center bg-white',
                !showLoading && 'hidden',
            )}
        >
            <AnimatedLoader />
        </div>
    );
};
