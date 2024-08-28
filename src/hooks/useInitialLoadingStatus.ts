import { atom, useAtom } from 'jotai';

type InitialLoadingStatus =
    | 'READY' // initial sync for the drive has been finished (either failed or succeeded)
    | 'LOADING' // remote drive is being loaded but not synced yet
    | 'SYNCING'; // remote drive is syncing

const DEFAULT_DRIVES_URL = import.meta.env.VITE_DEFAULT_DRIVES_URL || undefined;
const defaultDrives = DEFAULT_DRIVES_URL ? DEFAULT_DRIVES_URL.split(',') : [];

const defaultInitialState = defaultDrives.map(driveUrl => ({
    url: driveUrl,
    initialSyncStatus: 'LOADING' as InitialLoadingStatus,
}));

const drivesInitialSyncStatusAtom = atom(defaultInitialState);

export const useInitialLoadingStatus = () => {
    const [initialLoadingStatus, setInitialLoadingStatus] = useAtom(
        drivesInitialSyncStatusAtom,
    );

    const setDriveInitialLoadingStatus = (
        url: string,
        status: InitialLoadingStatus,
    ) =>
        setInitialLoadingStatus(prevState =>
            prevState.map(drive =>
                drive.url === url
                    ? { ...drive, initialSyncStatus: status }
                    : drive,
            ),
        );

    const getDriveInitialLoadingStatus = (driveId?: string) => {
        if (!driveId) return 'READY';

        const drive = initialLoadingStatus.find(driveStatus => {
            const parsedUrl = new URL(driveStatus.url);
            const pathname = parsedUrl.pathname;
            const driveIdFromUrl = pathname.substring(
                pathname.lastIndexOf('/') + 1,
            );

            return driveId === driveIdFromUrl;
        });

        return drive?.initialSyncStatus || 'READY';
    };

    return {
        initialLoadingStatus,
        setInitialLoadingStatus,
        setDriveInitialLoadingStatus,
        getDriveInitialLoadingStatus,
    };
};
