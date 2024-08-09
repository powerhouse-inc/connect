export const FEATURE_FLAG_KEY_STORAGE = 'feature-flags-config';

const ENABLED_EDITORS = import.meta.env.VITE_ENABLED_EDITORS || undefined;
const enabledEditors = ENABLED_EDITORS?.split(',');

const DISABLED_EDITORS = import.meta.env.VITE_DISABLED_EDITORS || undefined;
const DEFAULT_DRIVES_URL = import.meta.env.VITE_DEFAULT_DRIVES_URL || undefined;
const disabledEditors = DISABLED_EDITORS?.split(',');

export interface FeatureFlag {
    defaultDrives?: {
        url: string; // url of the remote drive
        loaded: boolean; // whether the drive has been loaded or not
        loading: boolean; // whether the drive is currently being loaded
        initialSyncReady?: boolean; // whether the drive was synced for the first time
    }[];
    editors: {
        enabledEditors?: '*' | string[];
        disabledEditors?: '*' | string[];
    };
}

const defaultConfig: FeatureFlag = {
    defaultDrives: DEFAULT_DRIVES_URL
        ? DEFAULT_DRIVES_URL.split(',').map(url => ({
              url,
              loading: true,
              loaded: false,
              initialSyncReady: false,
          }))
        : undefined,
    editors: {
        enabledEditors: ENABLED_EDITORS === '*' ? '*' : enabledEditors,
        disabledEditors: DISABLED_EDITORS === '*' ? '*' : disabledEditors,
    },
};

export default defaultConfig;
