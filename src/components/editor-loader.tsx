import { useEffect } from 'react';
import { useLoadingScreen } from 'src/hooks/useLoadingScreen';

export function EditorLoader() {
    const { setShowLoadingScreen } = useLoadingScreen();

    useEffect(() => {
        setShowLoadingScreen(true);
        return () => setShowLoadingScreen(false);
    }, [setShowLoadingScreen]);

    return null;
}
