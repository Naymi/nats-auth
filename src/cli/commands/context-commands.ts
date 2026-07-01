import type { Command } from 'commander';
import { confirm } from '@inquirer/prompts';
import { listContexts } from '../../commands/context/list.js';
import { selectContext } from '../../commands/context/select.js';
import { deleteContext } from '../../commands/context/delete.js';
import { cleanContexts } from '../../commands/context/clean.js';

export function registerContextCommands(program: Command): void {
  program
    .command('context:list')
    .description('List all NATS contexts')
    .action(async () => {
      await listContexts();
    });

  program
    .command('context:select <name>')
    .description('Select a context as default')
    .action(async (name: string) => {
      await selectContext({ name });
    });

  program
    .command('context:delete <name>')
    .description('Delete a NATS context')
    .action(async (name: string) => {
      await deleteContext({ name });
    });

  program
    .command('context:clean')
    .description('Delete all project-related contexts')
    .option('-y, --yes', 'Skip confirmation prompt', false)
    .action(async (options: { yes?: boolean }) => {
      await cleanContexts(options);
    });
}
