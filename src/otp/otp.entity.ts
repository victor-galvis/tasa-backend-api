import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('otp')
export class Otp {
  @PrimaryGeneratedColumn() id: number;
  @Column() code: string;
  @Column() email: string;
 @Column({ default: 'email_verification' }) type: string;
  @Column({ default: 'pending' }) status: string;
  @CreateDateColumn() created_at: Date;
  @Column({ nullable: true }) validated_at: Date;
}