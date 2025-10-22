import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'document_type_id' }) documentTypeId: number;
  @Column({ name: 'identification_number' }) identificationNumber: string;
  @Column() name: string;
  @Column() lastname: string;
  @Column() email: string;
  @Column() phonenumber: string;
  @Column() password: string;
  @Column({ name: 'city_id' }) cityId: string;
}
