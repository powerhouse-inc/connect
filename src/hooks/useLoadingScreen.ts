import { atom, useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useInitialLoadingStatus } from './useInitialLoadingStatus';

const showLoadingAtom = atom(false);
const customLoadingComponent = atom<React.ReactNode | undefined>(undefined);

type RouteParams = {
    driveId?: string;
    '*'?: string;
};

// this is to extend the initial loading screen for a bit to allow
// set the visibility of the loading screen manually and avoid flickering
const INITIAL_LOADING_TIMEOUT = 300;

export const useLoadingScreen = () => {
    const params = useParams<RouteParams>();
    const { getDriveInitialLoadingStatus } = useInitialLoadingStatus();
    const driveId = decodeURIComponent(params.driveId || '');

    const loadingStatus = getDriveInitialLoadingStatus(driveId);
    const timeout = useRef<NodeJS.Timeout | undefined>();

    const [showInitialLoading, setShowInitialLoading] = useState(
        loadingStatus !== 'READY',
    );
    const [showLoading, setShowLoading] = useAtom(showLoadingAtom);
    const [loadingComponent, setLoadingComponent] = useAtom(
        customLoadingComponent,
    );

    useEffect(() => {
        if (loadingStatus === 'READY') {
            timeout.current = setTimeout(() => {
                setShowInitialLoading(false);
            }, INITIAL_LOADING_TIMEOUT);
        }

        return () => clearTimeout(timeout.current);
    }, [loadingStatus]);

    const setShowLoadingScreen = (show: boolean) => {
        clearTimeout(timeout.current);
        setShowLoading(show);
    };

    const showLoadingScreen = showInitialLoading || showLoading;

    return {
        loadingComponent,
        showLoadingScreen,
        setLoadingComponent,
        setShowLoadingScreen,
    };
};
