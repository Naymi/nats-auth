import { PortSchema } from '../validation/schemas.js';

export class Port {
  private readonly value: number;

  constructor(value: number) {
    this.value = PortSchema.parse(value);
  }

  toNumber(): number {
    return this.value;
  }

  equals(other: Port): boolean {
    return this.value === other.value;
  }
}
