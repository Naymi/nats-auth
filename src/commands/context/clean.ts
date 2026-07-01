import { confirm } from '@inquirer/prompts';
import { Container } from '../../core/container.js';

export interface CleanContextsOptions {
  yes?: boolean;
}

export async function cleanContexts(options: CleanContextsOptions = {}): Promise<void> {
  const container = Container.getInstance();

  const available = await container.contextManager.checkAvailable();
  if (!available) {
    throw new Error('NATS CLI not found in PATH. Please install it from https://github.com/nats-io/natscli');
  }

  console.log('🔍 Finding project contexts...\n');

  const contexts = await container.contextManager.listContexts();
  const projectContexts = contexts.filter(ctx => ctx.name.startsWith('nats-auth-'));

  if (projectContexts.length === 0) {
    console.log('No project contexts found.');
    return;
  }

  console.log('Found project contexts:');
  for (const ctx of projectContexts) {
    console.log(`  - ${ctx.name}`);
  }
  console.log();

  let shouldDelete = options.yes;

  if (!shouldDelete) {
    shouldDelete = await confirm({
      message: `Delete ${projectContexts.length} project context(s)?`,
      default: false,
    });

    if (!shouldDelete) {
      console.log('❌ Operation cancelled.');
      return;
    }
  }

  console.log('🗑️  Deleting project contexts...\n');

  let deletedCount = 0;
  for (const ctx of projectContexts) {
    try {
      await container.contextManager.deleteContext(ctx.name);
      console.log(`  ✓ Deleted: ${ctx.name}`);
      deletedCount++;
    } catch (error) {
      console.log(`  ✗ Failed to delete: ${ctx.name}`);
      if (error instanceof Error) {
        console.log(`    Error: ${error.message}`);
      }
    }
  }

  console.log(`\n✨ Deleted ${deletedCount} of ${projectContexts.length} context(s)`);
}
