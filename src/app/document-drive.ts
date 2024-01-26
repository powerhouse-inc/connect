import { DocumentDriveServer, DriveInput } from 'document-drive/server';
import { FilesystemStorage } from 'document-drive/storage/filesystem';
import { DocumentDriveAction } from 'document-model-libs/document-drive';
import {
    BaseAction,
    DocumentModel,
    Operation,
    utils,
} from 'document-model/document';
import { IpcMain } from 'electron';
import { join } from 'path';

export default (
    documentModels: DocumentModel[],
    path: string,
    ipcMain: IpcMain,
) => {
    const documentDrive = new DocumentDriveServer(
        documentModels,
        new FilesystemStorage(join(path, 'Document Drives')),
    );

    documentDrive
        .initialize()
        .then(() =>
            documentDrive
                .getDrives()
                .then(drives => {
                    if (!drives.length) {
                        documentDrive
                            .addDrive({
                                global: {
                                    id: utils.hashKey(),
                                    name: 'My Local Drive',
                                    icon: null,
                                    remoteUrl: null,
                                },
                                local: {
                                    availableOffline: false,
                                    sharingType: 'private',
                                    listeners: [],
                                },
                            })
                            .catch(console.error);
                    }
                })
                .catch(console.error),
        )
        .catch(console.error);

    ipcMain.handle('documentDrive:getDrives', () => documentDrive.getDrives());
    ipcMain.handle('documentDrive:getDrive', (_e, id: string) =>
        documentDrive.getDrive(id),
    );
    ipcMain.handle('documentDrive:addDrive', (_e, input: DriveInput) =>
        documentDrive.addDrive(input),
    );
    ipcMain.handle('documentDrive:deleteDrive', (_e, id: string) =>
        documentDrive.deleteDrive(id),
    );

    ipcMain.handle('documentDrive:getDocuments', (_e, drive: string) =>
        documentDrive.getDocuments(drive),
    );
    ipcMain.handle(
        'documentDrive:getDocument',
        (_e, drive: string, id: string) => documentDrive.getDocument(drive, id),
    );
    ipcMain.handle(
        'documentDrive:addOperation',
        (_e, drive: string, id: string, operation: Operation) =>
            documentDrive.addOperation(drive, id, operation),
    );

    ipcMain.handle(
        'documentDrive:addOperations',
        (_e, drive: string, id: string, operations: Operation[]) =>
            documentDrive.addOperations(drive, id, operations),
    );

    ipcMain.handle(
        'documentDrive:addDriveOperation',
        (
            _e,
            drive: string,
            operation: Operation<DocumentDriveAction | BaseAction>,
        ) => documentDrive.addDriveOperation(drive, operation),
    );

    ipcMain.handle(
        'documentDrive:addDriveOperations',
        (
            _e,
            drive: string,
            operations: Operation<DocumentDriveAction | BaseAction>[],
        ) => documentDrive.addDriveOperations(drive, operations),
    );
};
