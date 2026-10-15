import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type InvoiceDownloadSource = 'client' | 'admin';

@Entity('invoice_download_log')
export class InvoiceDownloadLog {
  @PrimaryGeneratedColumn() id: number;

  @Column({ type: 'int', name: 'user_id', nullable: true })
  userId: number | null;

  @Column({ type: 'varchar', length: 255, name: 'user_email', nullable: true })
  userEmail: string | null;

  @Column({ type: 'varchar', length: 50, name: 'invoice_number' })
  invoiceNumber: string;

  /**
   * 'client' → descarga hecha por un usuario del portal
   * 'admin'  → descarga hecha desde el panel de administración (email en ADMIN_EMAIL)
   */
  @Column({ type: 'enum', enum: ['client', 'admin'], default: 'client' })
  source: InvoiceDownloadSource;

  @CreateDateColumn({ name: 'downloaded_at' })
  downloadedAt: Date;
}
