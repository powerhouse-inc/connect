const DISABLE_ADD_PUBLIC_DRIVES =
    import.meta.env.VITE_DISABLE_ADD_PUBLIC_DRIVES || undefined;
const DISABLE_ADD_CLOUD_DRIVES =
    import.meta.env.VITE_DISABLE_ADD_CLOUD_DRIVES || undefined;
const DISABLE_ADD_LOCAL_DRIVES =
    import.meta.env.VITE_DISABLE_ADD_LOCAL_DRIVES || undefined;
const DISABLE_DELETE_PUBLIC_DRIVES =
    import.meta.env.VITE_DISABLE_DELETE_PUBLIC_DRIVES || undefined;
const DISABLE_DELETE_CLOUD_DRIVES =
    import.meta.env.VITE_DISABLE_DELETE_CLOUD_DRIVES || undefined;
const DISABLE_DELETE_LOCAL_DRIVES =
    import.meta.env.VITE_DISABLE_DELETE_LOCAL_DRIVES || undefined;

const LOCAL_DRIVES_ENABLED =
    import.meta.env.VITE_LOCAL_DRIVES_ENABLED || undefined;
const CLOUD_DRIVES_ENABLED =
    import.meta.env.VITE_CLOUD_DRIVES_ENABLED || undefined;
const PUBLIC_DRIVES_ENABLED =
    import.meta.env.VITE_PUBLIC_DRIVES_ENABLED || undefined;

const SEARCH_BAR_ENABLED = import.meta.env.VITE_SEARCH_BAR_ENABLED || undefined;

export default {
    content: {
        showSearchBar: SEARCH_BAR_ENABLED !== 'false',
    },
    drives: {
        sections: {
            local: {
                enabled: LOCAL_DRIVES_ENABLED !== 'false',
                allowAdd: DISABLE_ADD_LOCAL_DRIVES !== 'true',
                allowDelete: DISABLE_DELETE_LOCAL_DRIVES !== 'true',
            },
            cloud: {
                enabled: CLOUD_DRIVES_ENABLED !== 'false',
                allowAdd: DISABLE_ADD_CLOUD_DRIVES !== 'true',
                allowDelete: DISABLE_DELETE_CLOUD_DRIVES !== 'true',
            },
            public: {
                enabled: PUBLIC_DRIVES_ENABLED !== 'false',
                allowAdd: DISABLE_ADD_PUBLIC_DRIVES !== 'true',
                allowDelete: DISABLE_DELETE_PUBLIC_DRIVES !== 'true',
            },
        },
    },
};