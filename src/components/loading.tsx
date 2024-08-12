import { AnimatedLoader } from '@powerhousedao/design-system';
import { useLoadingScreen } from 'src/hooks/useLoadingScreen';
import { twMerge } from 'tailwind-merge';

export const LoadingScreen = () => {
    const { showLoadingScreen, loadingComponent } = useLoadingScreen();

    if (loadingComponent && showLoadingScreen) {
        return loadingComponent;
    }

    return (
        <div
            className={twMerge(
                'absolute inset-0 z-10 flex items-center justify-center bg-white',
                !showLoadingScreen && 'hidden',
            )}
        >
            <AnimatedLoader />
        </div>
    );
};
