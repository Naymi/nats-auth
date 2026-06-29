import { HostSchema } from '../validation/schemas.js';

export class Host {
  private readonly value: string;

  constructor(value: string) {
    this.value = HostSchema.parse(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Host): boolean {
    return this.value === other.value;
  }
}
