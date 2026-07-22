import { City } from 'src/cities/cities.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('province')
export class Province {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 45 })
  name: string;

  @Column({ type: 'varchar', length: 10 })
  code: string;
}