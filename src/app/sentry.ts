import * as Sentry from '@sentry/react';
import config from 'connect-config';
import React from 'react';
import {
    createRoutesFromChildren,
    matchRoutes,
    useLocation,
    useNavigationType,
} from 'react-router-dom';

function initSenty() {
    if (!config.sentry.dsn || config.sentry.dsn === '') {
        return;
    }

    const release = import.meta.env.SENTRY_RELEASE;
    // sets the sentry release id on the window object, this is needed as
    // we prevent the sentry vite plugin from injecting it into the bundle
    (window as unknown as { SENTRY_RELEASE: unknown }).SENTRY_RELEASE = {
        id: release,
    };

    Sentry.init({
        release,
        dsn: config.sentry.dsn,
        environment: config.sentry.env,
        integrations: [
            Sentry.extraErrorDataIntegration({ depth: 5 }),
            Sentry.reactRouterV6BrowserTracingIntegration({
                useEffect: React.useEffect,
                useLocation,
                useNavigationType,
                createRoutesFromChildren,
                matchRoutes,
            }),
            Sentry.replayIntegration(),
            Sentry.captureConsoleIntegration({ levels: ['error'] }),
        ],
        ignoreErrors: [
            'User is not allowed to create files',
            'User is not allowed to move documents',
            'The user aborted a request.',
        ],
        tracesSampleRate: 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
    });
}

initSenty();
