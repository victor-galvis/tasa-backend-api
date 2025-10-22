import { Province } from 'src/provinces/province.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('city')
export class City {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 45 })
  name: string;

  @Column({ type: 'varchar', length: 10 })
  code: string;

  @Column({ type: 'int' })
  province_id: number;

  @Column({ name: 'province_id' })
  provinceId: number;

  @Column({ type: 'varchar', length: 100 })
  postal_code: string;
}
