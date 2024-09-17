/// <reference lib="WebWorker" />

import type { ServiceWorkerEvent } from './utils/registerServiceWorker';

const _self = self as unknown as ServiceWorkerGlobalScope;

const APP_VERSION = __APP_VERSION__;
const REQUIRES_HARD_REFRESH = __REQUIRES_HARD_REFRESH__;

const VERSION_CACHE = 'version-cache';
const VERSION_KEY = 'app-version';
const DOCUMENTS_CACHE = 'documents-cache';

_self.addEventListener('install', () => {
    _self.skipWaiting().catch(console.error);
});

_self.addEventListener('activate', async (event: ExtendableEvent) => {
    event.waitUntil(_self.clients.claim());

    checkAppVersion(APP_VERSION, REQUIRES_HARD_REFRESH).catch(console.error);
});

export type NEW_VERSION_AVAILABLE_MESSAGE = {
    type: 'NEW_VERSION_AVAILABLE';
    requiresHardRefresh: boolean;
};

export type ServiceWorkerMessageData = NEW_VERSION_AVAILABLE_MESSAGE;

export type ServiceWorkerMessage = ServiceWorkerEvent<ServiceWorkerMessageData>;

function postMessage(client: Client, message: ServiceWorkerMessageData) {
    return client.postMessage(message);
}

async function checkAppVersion(version: string, requiresHardRefresh: boolean) {
    try {
        const cache = await caches.open(VERSION_CACHE);
        const cachedResponse = await cache.match(VERSION_KEY);

        let currentVersion = '';

        if (cachedResponse) {
            currentVersion = await cachedResponse.text();
        }

        if (currentVersion === '') {
            // Initial cache
            await cache.put(VERSION_KEY, new Response(version));
        } else if (currentVersion !== version) {
            // New version detected
            console.log('Current version:', currentVersion);
            console.log('New version:', version);

            // Update the stored version
            await cache.put(VERSION_KEY, new Response(version));

            // Update clients
            await updateClients(requiresHardRefresh);
        }
    } catch (error) {
        console.error('Error checking version:', error);
    }
}

async function updateClients(requiresHardRefresh: boolean) {
    await _self.clients.claim();
    const clients = await _self.clients.matchAll();
    clients.forEach(client => {
        postMessage(client, {
            type: 'NEW_VERSION_AVAILABLE',
            requiresHardRefresh,
        });
    });
}

async function handleDocumentFetch(request: Request, cache: Cache) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone()).catch(console.error);
            return response;
        } else {
            const cachedResponse = await cache.match(request);
            return cachedResponse ?? response;
        }
    } catch (error) {
        console.error('Error fetching resource:', error);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        } else {
            throw error;
        }
    }
}

_self.addEventListener('fetch', async e => {
    const documentsCache = await caches.open(DOCUMENTS_CACHE);
    return e.respondWith(handleDocumentFetch(e.request, documentsCache));
});
