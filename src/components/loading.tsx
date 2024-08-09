import { AnimatedLoader } from '@powerhousedao/design-system';
import { useLoadingScreen } from 'src/hooks/useLoadingScreen';
import { twMerge } from 'tailwind-merge';

export const LoadingScreen = () => {
    const [showLoading] = useLoadingScreen();

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
