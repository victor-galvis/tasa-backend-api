import {
    Entity,
    PrimaryGeneratedColumn,
    Column
} from 'typeorm';

@Entity('address_validate')
export class AddressValidate {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 45 })
    company: string;

    @Column({ type: 'varchar', length: 45 })
    agreement: string;

    @Column({ type: 'int' })
    user_id: number;

    @Column({ type: 'varchar', length: 45, name: 'correct_address' })
    correctAddress: string;

    @Column({ type: 'varchar', length: 15 })
    status: string;

    @Column({ type: 'int' })
    attempts: number;
}
