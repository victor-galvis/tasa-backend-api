import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('facturas_s3')
export class InvoiceS3 {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'nombre_archivo', length: 20 })
  nombreArchivo: string;

  @Column({ name: 'ruta_completa', length: 20 })
  rutaCompleta: string;

  @Column({ name: 'numero_factura', length: 20 })
  numeroFactura: string;

  @Column({ name: 'numero_cedula', length: 20 })
  numeroCedula: string;
}
