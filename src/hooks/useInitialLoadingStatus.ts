import { useFeatureFlag } from './useFeatureFlags';

type InitialLoadingStatus =
    | 'READY'
    | 'LOADING_DEFAULT_DRIVES'
    | 'SYNCING_DRIVES';

export const useInitialLoadingStatus = (driveId?: string) => {
    const {
        config: { defaultDrives },
    } = useFeatureFlag();

    let status: InitialLoadingStatus = 'READY';

    const filteredDrives =
        (driveId
            ? defaultDrives?.filter(driveConfig => {
                  const parsedUrl = new URL(driveConfig.url);
                  const pathname = parsedUrl.pathname;
                  const driveIdFromUrl = pathname.substring(
                      pathname.lastIndexOf('/') + 1,
                  );

                  return driveId === driveIdFromUrl;
              })
            : defaultDrives) || [];

    if (
        filteredDrives.some(drive => !drive.loaded) ||
        filteredDrives.some(drive => drive.loading)
    ) {
        status = 'LOADING_DEFAULT_DRIVES';
    } else if (filteredDrives.some(drive => !drive.initialSyncReady)) {
        status = 'SYNCING_DRIVES';
    }

    return status;
};
