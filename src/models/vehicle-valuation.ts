import {
  AfterLoad,
  Column,
  Entity,
  PrimaryColumn,
} from 'typeorm';

import { providerEnum } from './provider-logs';

@Entity()
export class VehicleValuation {
  @PrimaryColumn({ length: 7 })
  vrm: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  lowestValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  highestValue: number;

  @Column({ type: "varchar", nullable: true })
  provider: providerEnum;

  get midpointValue(): number {
    return (this.highestValue + this.lowestValue) / 2;
  }

  @AfterLoad()
  setDefaultProvider() {
    if (this.provider === null) {
      this.provider = "supercar";
    }
  }
}
