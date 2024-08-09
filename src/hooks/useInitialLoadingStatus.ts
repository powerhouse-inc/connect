import { useFeatureFlag } from './useFeatureFlags';

type InitialLoadingStatus =
    | 'READY'
    | 'LOADING_DEFAULT_DRIVES'
    | 'SYNCING_DRIVES';

export const useInitialLoadingStatus = () => {
    const {
        config: { defaultDrives },
    } = useFeatureFlag();

    let status: InitialLoadingStatus = 'READY';

    if (
        defaultDrives?.some(drive => !drive.loaded) ||
        defaultDrives?.some(drive => drive.loading)
    ) {
        status = 'LOADING_DEFAULT_DRIVES';
    } else if (defaultDrives?.some(drive => !drive.initialSyncReady)) {
        status = 'SYNCING_DRIVES';
    }

    return status;
};
