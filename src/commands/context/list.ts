import { Container } from '../../core/container.js';

export async function listContexts(): Promise<void> {
  const container = Container.getInstance();

  const available = await container.contextManager.checkAvailable();
  if (!available) {
    throw new Error('NATS CLI not found in PATH. Please install it from https://github.com/nats-io/natscli');
  }

  console.log('📋 Listing NATS contexts...\n');

  const contexts = await container.contextManager.listContexts();

  if (contexts.length === 0) {
    console.log('No contexts found.');
    console.log('\nCreate contexts with:');
    console.log('  yarn cli server:context       - for main server');
    console.log('  yarn cli agent:context <name> - for agents');
    return;
  }

  const projectContexts = contexts.filter(ctx => ctx.name.startsWith('nats-auth-'));
  const otherContexts = contexts.filter(ctx => !ctx.name.startsWith('nats-auth-'));

  if (projectContexts.length > 0) {
    console.log('Project Contexts:');
    for (const ctx of projectContexts) {
      const selected = ctx.selected ? '✓ (selected)' : '';
      console.log(`  ${ctx.name} ${selected}`);
      console.log(`    URL: ${ctx.url}`);
      if (ctx.description) {
        console.log(`    Description: ${ctx.description}`);
      }
      console.log();
    }
  }

  if (otherContexts.length > 0) {
    console.log('Other Contexts:');
    for (const ctx of otherContexts) {
      const selected = ctx.selected ? '✓ (selected)' : '';
      console.log(`  ${ctx.name} ${selected}`);
      console.log(`    URL: ${ctx.url}`);
      if (ctx.description) {
        console.log(`    Description: ${ctx.description}`);
      }
      console.log();
    }
  }

  console.log(`Total: ${contexts.length} context(s)`);
}
