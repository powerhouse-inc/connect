import { useEffect, useRef } from 'react';
import { useDocumentDriveServer } from './useDocumentDriveServer';
import { useFeatureFlag } from './useFeatureFlags';
import defaultConfig from './useFeatureFlags/default-config';

type DefaultDrive = {
    url: string;
    loaded: boolean;
};

const isLoadedDrivesUpToDate = (
    defaultDrive: DefaultDrive,
    loadedDrives: DefaultDrive[],
) => {
    return !!loadedDrives.find(
        loadedDrive => loadedDrive.url === defaultDrive.url,
    );
};

const areLoadedDrivesUpToDate = (
    defaultDrivesConfig: DefaultDrive[],
    loadedDrives: DefaultDrive[],
) => {
    for (const defaultDrive of defaultDrivesConfig) {
        if (!isLoadedDrivesUpToDate(defaultDrive, loadedDrives)) {
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
        deleteDrive,
    } = useDocumentDriveServer();
    const {
        setConfig,
        config: { defaultDrives },
    } = useFeatureFlag();

    useEffect(() => {
        if (!defaultDrives) return;

        // checks if there are default drives missing
        // DEFAULT_DRIVES_URL might have changed
        const missingDefaultDrives =
            defaultConfig.defaultDrives
                ?.filter(
                    driveToLoad =>
                        !defaultDrives.find(
                            loadedDrive => loadedDrive.url === driveToLoad.url,
                        ),
                )
                .map(driveToLoad => ({
                    url: driveToLoad.url,
                    loaded: false,
                })) ?? [];

        // adds missing drives to config with loaded = false
        if (missingDefaultDrives.length > 0) {
            setConfig(conf => ({
                ...conf,
                defaultDrives: [
                    ...(conf.defaultDrives ?? []),
                    ...missingDefaultDrives,
                ],
            }));
        }

        // deletes drives that are not in the default drives list
        // (specific for ArbGrants)
        async function ArbGrantsDeleteOldDrives() {
            const drivesToDelete: { id: string; url?: string }[] = [];
            for (const loadedDrive of documentDrives) {
                const isEnvDefault = loadedDrive.state.local.triggers.find(
                    trigger =>
                        defaultConfig.defaultDrives?.find(
                            defaultDrive =>
                                trigger.data?.url === defaultDrive.url,
                        ),
                );

                if (!isEnvDefault) {
                    const trigger = loadedDrive.state.local.triggers.find(
                        trigger => trigger.type === 'PullResponder',
                    );

                    drivesToDelete.push({
                        id: loadedDrive.state.global.id,
                        url: trigger?.data?.url,
                    });
                }
            }
            if (drivesToDelete.length > 0) {
                const deletedUrls = drivesToDelete
                    .filter(drive => drive.url)
                    .map(drive => drive.url);
                try {
                    await Promise.all(
                        drivesToDelete.map(drive => deleteDrive(drive.id)),
                    );

                    setConfig(conf => ({
                        ...conf,
                        defaultDrives: (conf.defaultDrives || []).filter(
                            drive => !deletedUrls.includes(drive.url),
                        ),
                    }));
                    location.reload();
                } catch (e) {
                    console.error(e);
                }
            }
        }

        ArbGrantsDeleteOldDrives()
            .then(() => {
                for (const defaultDrive of defaultDrives) {
                    if (
                        documentDrivesStatus === 'LOADED' &&
                        !defaultDrive.loaded &&
                        !loadingDrives.current.includes(defaultDrive.url)
                    ) {
                        const isDriveAlreadyAdded = documentDrives.some(
                            drive => {
                                return drive.state.local.triggers.some(
                                    trigger =>
                                        trigger.data?.url === defaultDrive.url,
                                );
                            },
                        );

                        if (isDriveAlreadyAdded) {
                            setConfig(conf => ({
                                ...conf,
                                defaultDrives: [
                                    ...(conf.defaultDrives || []).filter(
                                        drive => drive.url !== defaultDrive.url,
                                    ),
                                    { ...defaultDrive, loaded: true },
                                ],
                            }));

                            return;
                        }

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
                                            drive =>
                                                drive.url !== defaultDrive.url,
                                        ),
                                        { ...defaultDrive, loaded: true },
                                    ],
                                })),
                            )
                            .catch(console.error)
                            .finally(() => {
                                loadingDrives.current =
                                    loadingDrives.current.filter(
                                        url => url !== defaultDrive.url,
                                    );
                            });
                    }
                }
            })
            .catch(console.error);
    }, [documentDrives, defaultDrives, documentDrivesStatus]);

    return loadingDrives.current.length > 0;
};
