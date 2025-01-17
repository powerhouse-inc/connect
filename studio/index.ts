import { Command } from 'commander';
import fs from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { startServer, StartServerOptions } from './server';

// TODO: repleace this by phconfig
export type PowerhouseConfig = {
    documentModelsDir: string;
    editorsDir: string;
    processorsDir: string;
    subgraphsDir: string;
    interactive?: boolean;
    skipFormat?: boolean;
    watch?: boolean;
    projects?: {
        packageName: string;
        global: boolean;
    }[];
};

export type Project = {
    name: string;
    path: string;
};

const IMPORT_SCRIPT_FILE = 'projects-import.js';
const POWERHOUSE_GLOBAL_DIR = join(homedir(), '.ph');
const projectRoot = process.cwd();

const readJsonFile = (filePath: string): PowerhouseConfig | null => {
    try {
        const absolutePath = resolve(filePath);
        const fileContents = fs.readFileSync(absolutePath, 'utf-8');
        return JSON.parse(fileContents) as PowerhouseConfig;
    } catch (error) {
        console.error(`Error reading file: ${filePath}`);
        return null;
    }
};

function mapProjects(projects: PowerhouseConfig['projects']): Project[] {
    if (!projects) {
        return [];
    }

    return projects.map(project => ({
        name: project.packageName,
        path: project.global
            ? join(
                  POWERHOUSE_GLOBAL_DIR,
                  'node_modules',
                  project.packageName,
                  'dist',
                  'es',
                  'index.js',
              )
            : join(
                  projectRoot,
                  'node_modules',
                  project.packageName,
                  'dist',
                  'es',
                  'index.js',
              ),
    }));
}

export type ConnectStudioOptions = {
    port?: string;
    host?: boolean;
    configFile?: string;
    localEditors?: string;
    localDocuments?: string;
};

export function generateImportSctipt(outputPath: string, projects: Project[]) {
    const importScriptFilePath = join(outputPath, IMPORT_SCRIPT_FILE);

    // create file if it doesn't exist, also create path if it doesn't exist (recursive)
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }

    if (!fs.existsSync(importScriptFilePath)) {
        fs.writeFileSync(importScriptFilePath, '');
    }

    const imports: string[] = [];
    const moduleNames: string[] = [];
    let counter = 0;

    for (const project of projects) {
        // check if file path exists first
        if (fs.existsSync(project.path)) {
            const moduleName = `module${counter}`;
            moduleNames.push(moduleName);
            imports.push(`import * as ${moduleName} from '${project.path}';`);
            counter++;
        } else {
            console.error(
                `Can not import project: ${project.name}, file not found: ${project.path}. Did you build the project or install it?`,
            );
        }
    }

    const exportStatement = `export default { ${moduleNames.join(', ')} }`;

    const fileContent = `${imports.join('\n')}\n\n${exportStatement}`;

    fs.writeFileSync(importScriptFilePath, fileContent);
}

export function startConnectStudio(options: ConnectStudioOptions) {
    let serverOptions: StartServerOptions = {};

    if (options.port) {
        process.env.PORT = options.port;
    }

    if (options.host) {
        process.env.HOST = options.host.toString();
    }

    if (options.configFile) {
        const config = readJsonFile(options.configFile);
        if (!config) return;

        const configFileDir = dirname(options.configFile);

        if (config.projects && config.projects.length > 0) {
            const projects = mapProjects(config.projects);
            generateImportSctipt(configFileDir, projects);
            process.env.LOAD_EXTERNAL_PROJECTS = 'true';

            serverOptions = {
                projectsImportPath: resolve(configFileDir, IMPORT_SCRIPT_FILE),
            };
        }

        if (config.documentModelsDir) {
            process.env.LOCAL_DOCUMENT_MODELS = isAbsolute(
                config.documentModelsDir,
            )
                ? config.documentModelsDir
                : join(configFileDir, config.documentModelsDir);
        }

        if (config.editorsDir) {
            process.env.LOCAL_DOCUMENT_EDITORS = isAbsolute(config.editorsDir)
                ? config.editorsDir
                : join(configFileDir, config.editorsDir);
        }
    }

    if (options.localEditors) {
        process.env.LOCAL_DOCUMENT_EDITORS = options.localEditors;
    }

    if (options.localDocuments) {
        process.env.LOCAL_DOCUMENT_MODELS = options.localDocuments;
    }

    return startServer(serverOptions).catch(error => {
        throw error;
    });
}

export const program = new Command();

program
    .name('Connect Studio')
    .description('Connect Studio CLI')
    .option('-p, --port <port>', 'Port to run the server on', '3000')
    .option('-h, --host', 'Expose the server to the network')
    .option(
        '--config-file <configFile>',
        'Path to the powerhouse.config.js file',
    )
    .option(
        '-le, --local-editors <localEditors>',
        'Link local document editors path',
    )
    .option(
        '-ld, --local-documents <localDocuments>',
        'Link local documents path',
    )
    .action(startConnectStudio);

program
    .command('help')
    .description('Display help information')
    .action(() => {
        program.help();
    });
