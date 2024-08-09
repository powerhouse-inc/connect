import { useEffect, useRef } from 'react';
import { logger } from 'src/services/logger';
import { useDocumentDriveServer } from './useDocumentDriveServer';
import { useFeatureFlag } from './useFeatureFlags';
import defaultConfig from './useFeatureFlags/default-config';
import { useUiNodes } from './useUiNodes';

const DRIVE_SYNC_TIMEOUT = 30000;

type DefaultDrive = {
    url: string;
    loaded: boolean;
};

const areLoadedDrivesUpToDate = (
    defaultDrivesConfig: DefaultDrive[],
    loadedDrives: DefaultDrive[],
) => {
    for (const defaultDrive of defaultDrivesConfig) {
        const loadedDrive = loadedDrives.find(
            loadedDrive => loadedDrive.url === defaultDrive.url,
        );

        if (!loadedDrive) {
            return false;
        }
    }

    return true;
};

export const useLoadDefaultDrives = () => {
    const loadingDrives = useRef<string[]>([]);
    const {
        addRemoteDrive,
        documentDrives,
        documentDrivesStatus,
        clearStorage,
    } = useDocumentDriveServer();
    const {
        setConfig,
        config: { defaultDrives },
    } = useFeatureFlag();
    const { onSyncStatus } = useUiNodes();

    const pendingDrives = defaultDrives?.filter(drive => !drive.loaded) || [];
    const isLoadingDrives = pendingDrives.some(drive => drive.loading);

    async function resetDefaultDrive() {
        await clearStorage();
        setConfig(defaultConfig);
        location.reload();
        loadingDrives.current = [];
    }

    useEffect(() => {
        // if for some reason the drives are not loaded and synced after 30 seconds, mark them as ready
        // this is to prevent the user from being stuck in the loading state
        const timeout = setTimeout(() => {
            setConfig(conf => ({
                ...conf,
                defaultDrives: (conf.defaultDrives || []).map(driveConf => ({
                    ...driveConf,
                    initialSyncReady: true,
                })),
            }));
        }, DRIVE_SYNC_TIMEOUT);

        return () => clearTimeout(timeout);
    }, []);

    useEffect(() => {
        const initialSyncRequired = defaultDrives?.some(
            drive => !drive.initialSyncReady,
        );

        if (!initialSyncRequired) return;

        const unsub = onSyncStatus((driveId, status) => {
            if (status === 'SYNCING') return;

            const drive = documentDrives.find(
                drive => drive.state.global.id === driveId,
            );
            if (!drive) return;

            const driveToUpdate = defaultDrives?.find(driveConfig => {
                return drive.state.local.triggers.some(
                    trigger => trigger.data?.url === driveConfig.url,
                );
            });

            if (!driveToUpdate) return;

            setConfig(conf => ({
                ...conf,
                defaultDrives: [
                    ...(conf.defaultDrives || []).filter(
                        drive => drive.url !== driveToUpdate.url,
                    ),
                    {
                        ...driveToUpdate,
                        initialSyncReady: true,
                    },
                ],
            }));
        });

        return unsub;
    }, [documentDrives, defaultDrives, onSyncStatus]);

    useEffect(() => {
        if (!defaultDrives) return;

        // reset default drives if config has been updated
        if (
            loadingDrives.current.length <= 0 &&
            defaultDrives.every(drive => drive.loaded) &&
            defaultConfig.defaultDrives &&
            defaultConfig.defaultDrives.length > 0 &&
            !areLoadedDrivesUpToDate(defaultConfig.defaultDrives, defaultDrives)
        ) {
            void resetDefaultDrive();
            return;
        }

        for (const defaultDrive of defaultDrives) {
            if (
                documentDrivesStatus === 'LOADED' &&
                !defaultDrive.loaded &&
                !loadingDrives.current.includes(defaultDrive.url)
            ) {
                const isDriveAlreadyAdded = documentDrives.some(drive => {
                    return drive.state.local.triggers.some(
                        trigger => trigger.data?.url === defaultDrive.url,
                    );
                });

                if (isDriveAlreadyAdded) {
                    setConfig(conf => ({
                        ...conf,
                        defaultDrives: [
                            ...(conf.defaultDrives || []).filter(
                                drive => drive.url !== defaultDrive.url,
                            ),
                            {
                                ...defaultDrive,
                                loaded: true,
                                loading: false,
                            },
                        ],
                    }));

                    return;
                }

                setConfig(conf => ({
                    ...conf,
                    defaultDrives: [
                        ...(conf.defaultDrives || []).filter(
                            drive => drive.url !== defaultDrive.url,
                        ),
                        {
                            ...defaultDrive,
                            loading: true,
                            initialSyncReady: false,
                        },
                    ],
                }));

                loadingDrives.current.push(defaultDrive.url);

                addRemoteDrive(defaultDrive.url, {
                    sharingType: 'PUBLIC',
                    availableOffline: true,
                    listeners: [
                        {
                            block: true,
                            callInfo: {
                                data: defaultDrive.url,
                                name: 'switchboard-push',
                                transmitterType: 'SwitchboardPush',
                            },
                            filter: {
                                branch: ['main'],
                                documentId: ['*'],
                                documentType: ['*'],
                                scope: ['global'],
                            },
                            label: 'Switchboard Sync',
                            listenerId: '1',
                            system: true,
                        },
                    ],
                    triggers: [],
                    pullInterval: 3000,
                })
                    .then(() =>
                        setConfig(conf => ({
                            ...conf,
                            defaultDrives: [
                                ...(conf.defaultDrives || []).filter(
                                    drive => drive.url !== defaultDrive.url,
                                ),
                                {
                                    ...defaultDrive,
                                    loaded: true,
                                },
                            ],
                        })),
                    )
                    .catch(err => {
                        logger.error(err);

                        setConfig(conf => ({
                            ...conf,
                            defaultDrives: [
                                ...(conf.defaultDrives || []).filter(
                                    drive => drive.url !== defaultDrive.url,
                                ),
                                { ...defaultDrive, initialSyncReady: true },
                            ],
                        }));
                    })
                    .finally(() => {
                        setConfig(conf => ({
                            ...conf,
                            defaultDrives: [
                                ...(conf.defaultDrives || []).filter(
                                    drive => drive.url !== defaultDrive.url,
                                ),
                                { ...defaultDrive, loading: false },
                            ],
                        }));

                        loadingDrives.current = loadingDrives.current.filter(
                            url => url !== defaultDrive.url,
                        );
                    });
            }
        }
    }, [documentDrives, documentDrivesStatus]);

    return isLoadingDrives;
};
