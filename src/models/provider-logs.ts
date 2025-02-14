import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from 'typeorm';

export const providers = {
    'supercar': 'supercar',
    'premiumcar': 'premiumcar'
} as const

export type providerEnum = (typeof providers)[keyof typeof providers];


@Entity()
export class ProviderLogs {
    @PrimaryGeneratedColumn()
    id: string;

    @Index()
    @Column()
    vrm: string;

    @Column({ type: "varchar" })
    provider: providerEnum;

    @CreateDateColumn({ type: 'datetime' })
    date: Date;

    @Column({ type: 'int' })
    durationInMilliseconds: number;

    @Column()
    url: string;

    @Column({ type: 'int' })
    code: number;

    @Column({ nullable: true })
    error?: string;

}
