import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('contract')
export class Contract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ length: 45 })
  number: string;

  @Column({ length: 45 })
  name: string;

  @Column({ name: 'delivery_method', length: 20 })
  deliveryMethod: string;

  @CreateDateColumn({ type: 'datetime', nullable: true })
  created_at: Date;

  @Column({ name: 'province_id' })
  provinceId: number;

  @Column({ name: 'company_id' })
  companyId: number;

  @Column({ name: 'city_id' })
  cityId: number;
}
