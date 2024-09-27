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

const LOCAL_DOCUMENTS_IMPORT_NAME = 'LOCAL_DOCUMENT_MODELS';

export async function startServer() {
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const LOCAL_DOCUMENT_MODELS = process.env.LOCAL_DOCUMENT_MODELS
        ? resolvePath(rootDirname, process.env.LOCAL_DOCUMENT_MODELS)
        : '';
    const LOCAL_DOCUMENT_EDITORS = process.env.LOCAL_DOCUMENT_EDITORS
        ? resolvePath(rootDirname, process.env.LOCAL_DOCUMENT_EDITORS)
        : '';
    const LOCAL_EDITORS_IMPORT_NAME = 'LOCAL_EDITORS_MODELS';
    const VITE_ENVS_SCRIPT = join(appPath, 'vite-envs.sh');

    /** @type {import('vite').AliasOptions} */
    const alias = {};
    if (LOCAL_DOCUMENT_MODELS) {
        alias.LOCAL_DOCUMENT_MODELS = LOCAL_DOCUMENT_MODELS;
    }
    if (LOCAL_DOCUMENT_EDITORS) {
        alias[LOCAL_EDITORS_IMPORT_NAME] = LOCAL_DOCUMENT_EDITORS;
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
                                    console.error(`stderr: ${stderr}`);
                                }
                                console.log(`stdout: ${stdout}`);
                            },
                        );
                    }
                },
            },
            WatchLocalPlugin(LOCAL_DOCUMENT_MODELS, LOCAL_DOCUMENT_EDITORS),
        ],
        resolve: {
            alias: {
                LOCAL_DOCUMENT_MODELS: LOCAL_DOCUMENT_MODELS,
            },
        },
    };

    const server = await createServer(config);

    await server.listen();

    server.printUrls();
    server.bindCLIShortcuts({ print: true });
}
