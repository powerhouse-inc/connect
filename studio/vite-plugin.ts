import path from 'node:path';
import { Alias, AliasOptions, Plugin, normalizePath } from 'vite';

export const LOCAL_DOCUMENT_MODELS_IMPORT = 'LOCAL_DOCUMENT_MODELS';
export const LOCAL_DOCUMENT_EDITORS_IMPORT = 'LOCAL_DOCUMENT_EDITORS';

export function getStudioConfig(env?: Record<string, string>): {
    [LOCAL_DOCUMENT_MODELS_IMPORT]?: string;
    [LOCAL_DOCUMENT_EDITORS_IMPORT]?: string;
} {
    const config: Record<string, string> = {};

    const LOCAL_DOCUMENT_MODELS =
        process.env.LOCAL_DOCUMENT_MODELS ?? env?.LOCAL_DOCUMENT_MODELS;
    const LOCAL_DOCUMENT_EDITORS =
        process.env.LOCAL_DOCUMENT_EDITORS ?? env?.LOCAL_DOCUMENT_EDITORS;

    const LOCAL_DOCUMENT_MODELS_PATH = LOCAL_DOCUMENT_MODELS
        ? path.resolve(process.cwd(), LOCAL_DOCUMENT_MODELS)
        : undefined;
    const LOCAL_DOCUMENT_EDITORS_PATH = LOCAL_DOCUMENT_EDITORS
        ? path.resolve(process.cwd(), LOCAL_DOCUMENT_EDITORS)
        : undefined;

    if (LOCAL_DOCUMENT_MODELS_PATH) {
        config[LOCAL_DOCUMENT_MODELS_IMPORT] = normalizePath(
            LOCAL_DOCUMENT_MODELS_PATH,
        );
    }
    if (LOCAL_DOCUMENT_EDITORS_PATH) {
        config[LOCAL_DOCUMENT_EDITORS_IMPORT] = normalizePath(
            LOCAL_DOCUMENT_EDITORS_PATH,
        );
    }

    return config;
}

export function viteConnectDevStudioPlugin(
    env?: Record<string, string>,
): Plugin {
    const studioConfig = getStudioConfig(env);
    const importKeys = [
        LOCAL_DOCUMENT_MODELS_IMPORT,
        LOCAL_DOCUMENT_EDITORS_IMPORT,
    ];

    return {
        name: 'vite-plugin-connect-dev-studio',
        enforce: 'pre',
        config(config) {
            if (
                !studioConfig[LOCAL_DOCUMENT_MODELS_IMPORT] &&
                !studioConfig[LOCAL_DOCUMENT_EDITORS_IMPORT]
            ) {
                return;
            }

            // adds the provided paths to be resolved by vite
            const resolve = config.resolve ?? {};
            const alias = resolve.alias;
            let resolvedAlias: AliasOptions | undefined;
            if (Array.isArray(alias)) {
                const arrayAlias = [...(alias as Alias[])];

                if (studioConfig[LOCAL_DOCUMENT_MODELS_IMPORT]) {
                    arrayAlias.push({
                        find: LOCAL_DOCUMENT_MODELS_IMPORT,
                        replacement: studioConfig[LOCAL_DOCUMENT_MODELS_IMPORT],
                    });
                }

                if (studioConfig[LOCAL_DOCUMENT_EDITORS_IMPORT]) {
                    arrayAlias.push({
                        find: LOCAL_DOCUMENT_EDITORS_IMPORT,
                        replacement:
                            studioConfig[LOCAL_DOCUMENT_EDITORS_IMPORT],
                    });
                }
                resolvedAlias = arrayAlias;
            } else if (typeof alias === 'object') {
                resolvedAlias = { ...alias, ...studioConfig };
            } else if (typeof alias === 'undefined') {
                resolvedAlias = { ...studioConfig };
            } else {
                console.error('resolve.alias was not recognized');
            }

            if (resolvedAlias) {
                resolve.alias = resolvedAlias;
                config.resolve = resolve;
            }
        },
        resolveId: id => {
            // if the path was not provided then declares the local
            // imports as external so that vite ignores them
            if (importKeys.includes(id)) {
                return {
                    id,
                    external: true,
                };
            }
        },
    };
}
