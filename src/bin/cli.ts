#!/usr/bin/env node

import { Command } from 'commander';
import prompts from 'prompts';
import chalk from 'chalk';
import degit from 'degit';
import ora from 'ora';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const program = new Command();

program
    .name('nodets-boilerplate-aviato')
    .description('Scaffold a new Enterprise Node.js + TypeScript project')
    .argument('[directory]', 'directory to create the project in')
    .action(async (directory) => {
        console.log(chalk.bold.blue('\n🚀 Enterprise Node.js Boilerplate Generator\n'));

        // 1. Get Project Directory
        let projectDir = directory;

        if (!projectDir) {
            const res = await prompts({
                type: 'text',
                name: 'directory',
                message: 'Where would you like to create your new project?',
                initial: 'my-node-app'
            });

            if (!res.directory) {
                console.log(chalk.red('❌ Operation cancelled'));
                process.exit(1);
            }
            projectDir = res.directory;
        }

        const targetPath = path.resolve(process.cwd(), projectDir);

        if (fs.existsSync(targetPath) && fs.readdirSync(targetPath).length > 0) {
            const res = await prompts({
                type: 'confirm',
                name: 'overwrite',
                message: `Directory ${chalk.cyan(projectDir)} is not empty. Continue?`,
                initial: false
            });

            if (!res.overwrite) {
                console.log(chalk.red('❌ Operation cancelled'));
                process.exit(1);
            }
        }

        // 2. Clone Repository
        const spinner = ora(`Downloading template...`).start();

        try {
            const emitter = degit('JayAviato/nodejs-boilerplate#main', {
                cache: false,
                force: true,
                verbose: true,
            });

            await emitter.clone(targetPath);
            spinner.succeed(chalk.green('Template downloaded successfully!'));
        } catch (err) {
            spinner.fail(chalk.red('Failed to download template'));
            console.error(err);
            process.exit(1);
        }

        // 3. Customize Project
        console.log(chalk.blue('\n📦 Configuring project...'));

        try {
            const pkgPath = path.join(targetPath, 'package.json');
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

            pkg.name = path.basename(projectDir);
            pkg.version = '0.1.0';
            pkg.description = 'Created with Enterprise Node.js Boilerplate';

            // Remove the bin entry from the scaffolded project so it doesn't try to be a CLI itself
            delete pkg.bin;

            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
        } catch (err) {
            console.log(chalk.yellow('⚠️  Could not auto-update package.json name. You may need to do it manually.'));
        }

        // 4. Install Dependencies
        const installRes = await prompts({
            type: 'confirm',
            name: 'install',
            message: 'Would you like to install dependencies now?',
            initial: true
        });

        if (installRes.install) {
            const installSpinner = ora('Installing dependencies...').start();
            try {
                execSync('npm install', { cwd: targetPath, stdio: 'ignore' });
                installSpinner.succeed(chalk.green('Dependencies installed!'));
            } catch (err) {
                installSpinner.fail(chalk.red('Failed to install dependencies. Please run "npm install" manually.'));
            }
        }

        // 5. Setup Environment
        try {
            const envExample = path.join(targetPath, '.env.example');
            const envFile = path.join(targetPath, '.env');
            if (fs.existsSync(envExample)) {
                fs.copyFileSync(envExample, envFile);
                console.log(chalk.green('✅ .env file created from .env.example'));
            }
        } catch (err) {
            // Ignore
        }

        console.log(chalk.bold.green('\n🎉 Project ready!'));
        console.log(`\nTo get started:\n`);
        console.log(chalk.cyan(`  cd ${projectDir}`));
        if (!installRes.install) {
            console.log(chalk.cyan(`  npm install`));
        }
        console.log(chalk.cyan(`  npm run dev`));
        console.log('\n');
    });

program.parse(process.argv);
