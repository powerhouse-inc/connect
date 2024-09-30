import {
    ToastContainer,
    UiNodesContextProvider,
} from '@powerhousedao/design-system';
import React from 'react';
import ReadModeContextProvider from 'src/context/read-mode';
import CookieBanner from './cookie-banner';
import ModalManager from './modal';

interface AppContentProps {
    children?: React.ReactNode;
}

const Router = React.lazy(async () => {
    const createRouterComponent = await import('./router');
    const router = await createRouterComponent.default();
    return { default: router };
});

export const AppContent: React.FC<AppContentProps> = ({ children }) => (
    <ReadModeContextProvider>
        <UiNodesContextProvider>
            <ToastContainer position="bottom-right" />
            <ModalManager>
                <Router />
                <CookieBanner />
                {children}
            </ModalManager>
        </UiNodesContextProvider>
    </ReadModeContextProvider>
);

export default AppContent;
