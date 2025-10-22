import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('invoice')
export class Invoice {
  @PrimaryGeneratedColumn() id: number;
  @Column() number: string;
}