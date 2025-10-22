import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('document_types')
export class DocumentTypes {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
