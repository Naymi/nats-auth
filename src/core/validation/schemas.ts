import { z } from 'zod';

/**
 * Validate account user (email format)
 */
export const AccountUserSchema = z.object({
  user: z.string().email('User must be a valid email address'),
});

/**
 * Validate account (name and users)
 */
export const AccountSchema = z.object({
  name: z
    .string()
    .min(1, 'Account name is required')
    .regex(/^[A-Z_][A-Z0-9_]*$/, 'Account name must be uppercase with underscores'),
  users: z.array(AccountUserSchema).min(1, 'Account must have at least one user'),
});

/**
 * Validate leafnode authorization entry
 */
export const LeafNodeAuthSchema = z.object({
  user: z.string().email('User must be a valid email address'),
  account: z.string().min(1, 'Account name is required'),
});

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

export const DeleteAgentOptionsSchema = z.object({
  name: AgentNameSchema,
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
