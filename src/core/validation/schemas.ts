import { z } from 'zod';

/**
 * Validate agent name (only letters, numbers, hyphens, and underscores)
 */
export const AgentNameSchema = z
  .string()
  .min(1, 'Agent name cannot be empty')
  .max(63, 'Agent name too long (max 63 characters)')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Agent name can only contain letters, numbers, hyphens, and underscores'
  );

/**
 * Validate port number (1-65535)
 */
export const PortSchema = z
  .number()
  .int('Port must be an integer')
  .min(1, 'Port must be >= 1')
  .max(65535, 'Port must be <= 65535');

/**
 * Validate host (IP address or hostname)
 */
export const HostSchema = z
  .string()
  .min(1, 'Host cannot be empty')
  .refine(
    (host) => {
      // Check IPv4 address or hostname
      const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      const hostnamePattern = /^[a-zA-Z0-9.-]+$/;

      return ipv4Pattern.test(host) || hostnamePattern.test(host);
    },
    { message: 'Invalid host format (must be IPv4 address or hostname)' }
  );

/**
 * Validate JetStream domain name (alphanumeric, hyphens, underscores)
 */
export const DomainSchema = z
  .string()
  .min(1, 'Domain cannot be empty')
  .max(63, 'Domain too long (max 63 characters)')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Domain can only contain letters, numbers, hyphens, and underscores'
  )
  .optional();

/**
 * Schema for creating an agent
 */
export const CreateAgentOptionsSchema = z.object({
  name: AgentNameSchema,
  port: PortSchema.default(4223),
  host: HostSchema.default('127.0.0.1'),
  domain: DomainSchema,
  replace: z.boolean().optional().default(false),
});

/**
 * Schema for editing agent configuration
 */
export const EditAgentOptionsSchema = z.object({
  name: AgentNameSchema,
  port: PortSchema.optional(),
  host: HostSchema.optional(),
  remoteUrl: z.url().optional(),
});
