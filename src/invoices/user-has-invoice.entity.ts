import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('user_has_invoice')
export class UserHasInvoice {
  @PrimaryColumn() user_id: number;
  @PrimaryColumn() invoice_id: number;
  @Column({ type: 'datetime' }) created_at: Date;
}