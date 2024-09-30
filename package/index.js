import { exec } from 'node:child_process';
import fs from 'node:fs';
import { join, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLogger, createServer } from 'vite';
import { viteEnvs } from 'vite-envs';

const rootDirname = process.cwd();
const connectDirname = fileURLToPath(new URL('.', import.meta.url));
const appPath = join(connectDirname, '../dist');

// silences dynamic import warnings
const logger = createLogger();
const loggerWarn = logger.warn;
/**
 * @param {string} msg
 * @param {import('vite').LogOptions} options
 */
logger.warn = (msg, options) => {
    if (msg.includes('The above dynamic import cannot be analyzed by Vite.')) {
        return;
    }
    loggerWarn(msg, options);
};

function viteIgnoreStaticImport(importKeys) {
    return {
        name: 'vite-plugin-ignore-static-import',
        enforce: 'pre',
        // 1. insert to optimizeDeps.exclude to prevent pre-transform
        config(config) {
            config.optimizeDeps = {
                ...(config.optimizeDeps ?? {}),
                exclude: [
                    ...(config.optimizeDeps?.exclude ?? []),
                    ...importKeys,
                ],
            };
        },
        // 2. push a plugin to rewrite the 'vite:import-analysis' prefix
        configResolved(resolvedConfig) {
            const VALID_ID_PREFIX = `/@id/`;
            const reg = new RegExp(
                `${VALID_ID_PREFIX}(${importKeys.join('|')})`,
                'g',
            );

            resolvedConfig.plugins.push({
                name: 'vite-plugin-ignore-static-import-replace-idprefix',
                transform: code =>
                    reg.test(code) ? code.replace(reg, (_, s1) => s1) : code,
            });
        },
        // 3. rewrite the id before 'vite:resolve' plugin transform to 'node_modules/...'
        resolveId: id => {
            if (importKeys.includes(id)) {
                return { id, external: true };
            }
        },
    };
}

/**
 * @param {string | undefined} documentModelsPath
 * @param {string | undefined} editorsPath
 * @return {import('vite').PluginOption}
 * */
function WatchLocalPlugin(documentModelsPath, editorsPath) {
    return {
        name: 'watch-custom-path',
        configureServer(server) {
            if (documentModelsPath) {
                // Use fs to watch the file and trigger a server reload when it changes
                console.log(
                    `Watching local document models at '${documentModelsPath}'...`,
                );
                try {
                    fs.watch(
                        documentModelsPath,
                        {
                            recursive: true,
                        },
                        (event, filename) => {
                            console.log(
                                `Local document models changed, reloading server...`,
                            );
                            server.ws.send({
                                type: 'full-reload',
                                path: '*',
                            });
                        },
                    );
                } catch (e) {
                    console.error('Error watching local document models', e);
                }
            }

            if (editorsPath) {
                console.log(
                    `Watching local document editors at '${editorsPath}'...`,
                );
                try {
                    fs.watch(
                        editorsPath,
                        {
                            recursive: true,
                        },
                        (event, filename) => {
                            console.log(
                                `Local document models changed, reloading server...`,
                            );
                            server.ws.send({
                                type: 'full-reload',
                                path: '*',
                            });
                        },
                    );
                } catch (e) {
                    console.error('Error watching local document models', e);
                }
            }
        },
    };
}

export async function startServer() {
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const LOCAL_DOCUMENT_MODELS = process.env.LOCAL_DOCUMENT_MODELS
        ? resolvePath(rootDirname, process.env.LOCAL_DOCUMENT_MODELS)
        : '';
    const LOCAL_DOCUMENT_EDITORS = process.env.LOCAL_DOCUMENT_EDITORS
        ? resolvePath(rootDirname, process.env.LOCAL_DOCUMENT_EDITORS)
        : '';

    const VITE_ENVS_SCRIPT = join(appPath, 'vite-envs.sh');

    /** @type {import('vite').AliasOptions} */
    const alias = {};
    if (LOCAL_DOCUMENT_MODELS) {
        alias.LOCAL_DOCUMENT_MODELS = LOCAL_DOCUMENT_MODELS;
    }
    if (LOCAL_DOCUMENT_EDITORS) {
        alias.LOCAL_EDITORS_MODELS = LOCAL_DOCUMENT_EDITORS;
    }

    if (!fs.existsSync(join(appPath, 'src'))) {
        fs.mkdirSync(join(appPath, 'src'));
    }

    /** @type {import('vite').InlineConfig} */
    const config = {
        customLogger: logger,
        configFile: false,
        root: appPath,
        server: {
            port: PORT,
            open: true,
        },
        plugins: [
            viteIgnoreStaticImport([
                'LOCAL_DOCUMENT_MODELS',
                'LOCAL_DOCUMENT_EDITORS',
            ]),
            viteEnvs({
                declarationFile: join(connectDirname, '../.env'),
                computedEnv: {
                    LOCAL_DOCUMENT_MODELS,
                    LOCAL_DOCUMENT_EDITORS,
                },
            }),
            {
                name: 'run-viteEnvs-script',
                buildStart() {
                    if (fs.existsSync(VITE_ENVS_SCRIPT)) {
                        exec(
                            `sh ${VITE_ENVS_SCRIPT}`,
                            (error, stdout, stderr) => {
                                if (error) {
                                    console.error(
                                        `Error executing the script: ${error.message}`,
                                    );
                                    return;
                                }
                                if (stderr) {
                                    console.error(stderr);
                                }
                            },
                        );
                    }
                },
            },
            WatchLocalPlugin(LOCAL_DOCUMENT_MODELS, LOCAL_DOCUMENT_EDITORS),
        ],
        resolve: {
            alias,
        },
    };

    const server = await createServer(config);

    await server.listen();

    server.printUrls();
    server.bindCLIShortcuts({ print: true });
}
