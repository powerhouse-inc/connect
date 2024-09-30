import connectConfig from 'connect-config';
import { type IDocumentDriveServer } from 'document-drive';
import { utils } from 'document-model/document';
import { atom, getDefaultStore, useAtomValue } from 'jotai';
import { unwrap } from 'jotai/utils';
import { logger } from 'src/services/logger';
import {
    baseDocumentModels,
    subscribeDocumentModels,
} from 'src/store/document-model';
import { createBrowserDocumentDriveServer } from 'src/utils/reactor';

const defaultStore = getDefaultStore();

async function initReactor(reactor: IDocumentDriveServer) {
    const errors = await reactor.initialize();
    const error = errors?.at(0);
    if (error) {
        throw error;
    }

    const drives = await reactor.getDrives();
    if (!drives.length && connectConfig.drives.sections.LOCAL.enabled) {
        reactor
            .addDrive({
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
            })
            .catch(logger.error);
    }
}

const reactor = (async () => {
    const server =
        (window.electronAPI
            ?.documentDrive as unknown as IDocumentDriveServer) ??
        createBrowserDocumentDriveServer(
            baseDocumentModels,
            connectConfig.routerBasename,
        );
    await initReactor(server);
    return server;
})();

const reactorAtom = atom<Promise<IDocumentDriveServer>>(reactor);

// blocks rendering until reactor is initialized.
export const useReactor = () => useAtomValue(reactorAtom);

const unwrappedReactor = unwrap(reactorAtom);

// will return undefined until reactor is initialized. Does not block rendering.
export const useUnwrappedReactor = () => useAtomValue(unwrappedReactor);

export const useReactorAsync = () => {
    return reactor;
};

// updates reactor document models when they change.
subscribeDocumentModels(async documentModels => {
    const reactor = await defaultStore.get(reactorAtom);
    reactor.setDocumentModels(documentModels);
});
