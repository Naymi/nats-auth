import { AgentNameSchema } from '../validation/schemas.js';

export class AgentName {
  private readonly value: string;

  constructor(value: string) {
    this.value = AgentNameSchema.parse(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: AgentName): boolean {
    return this.value === other.value;
  }
}
