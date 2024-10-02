import { exec } from 'node:child_process';
import fs from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLogger, createServer, InlineConfig, Plugin } from 'vite';
import { viteEnvs } from 'vite-envs';
import { getStudioConfig, viteConnectDevStudioPlugin } from './vite-plugin';

const studioDirname = fileURLToPath(new URL('.', import.meta.url));
const appPath = join(studioDirname, '..');
const viteEnvsScript = join(appPath, 'vite-envs.sh');

// silences dynamic import warnings
const logger = createLogger();
// eslint-disable-next-line @typescript-eslint/unbound-method
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
export function WatchLocalPlugin(
    documentModelsPath: string,
    editorsPath: string,
): Plugin {
    return {
        name: 'vite-plugin-watch-custom-path',
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

function runShellScriptPlugin(scriptPath: string): Plugin {
    return {
        name: 'vite-plugin-run-shell-script',
        buildStart() {
            if (fs.existsSync(scriptPath)) {
                exec(`sh ${scriptPath}`, (error, stdout, stderr) => {
                    if (error) {
                        console.error(
                            `Error executing the script: ${error.message}`,
                        );
                        return;
                    }
                    if (stderr) {
                        console.error(stderr);
                    }
                });
            }
        },
    };
}

export async function startServer() {
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const studioConfig = getStudioConfig();

    // needed for viteEnvs
    if (!fs.existsSync(join(appPath, 'src'))) {
        fs.mkdirSync(join(appPath, 'src'));
    }

    process.env.PH_CONNECT_STUDIO_MODE = 'true';

    const config: InlineConfig = {
        customLogger: logger,
        configFile: false,
        root: appPath,
        server: {
            port: PORT,
            open: true,
        },
        plugins: [
            viteConnectDevStudioPlugin(),
            viteEnvs({
                declarationFile: join(studioDirname, '../.env'),
                computedEnv: studioConfig,
            }),
            runShellScriptPlugin(viteEnvsScript),
            // WatchLocalPlugin(LOCAL_DOCUMENT_MODELS, LOCAL_DOCUMENT_EDITORS),
        ],
    };

    const server = await createServer(config);

    await server.listen();

    server.printUrls();
    server.bindCLIShortcuts({ print: true });
}
