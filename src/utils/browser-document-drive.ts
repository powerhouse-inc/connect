import connectConfig from 'connect-config';
import InMemoryCache from 'document-drive/cache/memory';
import { BaseQueueManager } from 'document-drive/queue/base';
import { DocumentDriveServer } from 'document-drive/server';
import { BrowserStorage } from 'document-drive/storage/browser';
import { utils } from 'document-model/document';
import { documentModels } from 'src/store/document-model';

const storage = new BrowserStorage(connectConfig.routerBasename);

export const BrowserDocumentDriveServer = new DocumentDriveServer(
    documentModels,
    storage,
    new InMemoryCache(),
    new BaseQueueManager(10, 10),
);
storage
    .migrateOperationSignatures()
    .then(() =>
        BrowserDocumentDriveServer.initialize()
            .then(() =>
                BrowserDocumentDriveServer.getDrives()
                    .then(drives => {
                        if (
                            !drives.length &&
                            connectConfig.drives.sections.local.enabled
                        ) {
                            BrowserDocumentDriveServer.addDrive({
                                global: {
                                    id: utils.hashKey(),
                                    name: 'My Local Drive',
                                    icon: null,
                                    slug: 'my-local-drive',
                                },
                                local: {
                                    availableOffline: false,
                                    sharingType: 'private',
                                    listeners: [],
                                    triggers: [],
                                },
                            }).catch(console.error);
                        }
                    })
                    .catch(console.error),
            )
            .catch(console.error),
    )
    .catch(console.error);
