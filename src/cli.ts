#!/usr/bin/env node
import { Command } from 'commander';
import { ZodError } from 'zod';
import { registerAgentCommands } from './cli/commands/agent-commands.js';
import { registerServerCommands } from './cli/commands/server-commands.js';
import { registerInitCommands } from './cli/commands/init-commands.js';

function handleError(error: unknown): void {
  if (error instanceof ZodError) {
    console.error('❌ Validation error:');
    error.issues.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }

  if (error instanceof Error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }

  console.error('❌ Unknown error occurred');
  process.exit(1);
}

const program = new Command();

program
  .name('nats-auth')
  .description('NATS server and agent TLS certificate management')
  .version('1.0.0');

registerInitCommands(program);
registerServerCommands(program);
registerAgentCommands(program);

program.parse(process.argv);

process.on('unhandledRejection', handleError);
process.on('uncaughtException', handleError);
