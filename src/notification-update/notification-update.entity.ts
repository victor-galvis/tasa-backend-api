import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export type NotificationUpdateType = 'email' | 'address';
export type NotificationUpdateStatus = 'PENDING' | 'UPDATED' | 'BLOCKED';

@Entity('notification_update')
export class NotificationUpdate {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 45 })
    company: string;

    @Column({ type: 'varchar', length: 45 })
    agreement: string;

    @Column({ type: 'int' })
    user_id: number;

    /**
     * 'email'   → tracks email update attempts
     * 'address' → tracks physical address update attempts
     */
    @Column({
        type: 'enum',
        enum: ['email', 'address'],
        name: 'update_type',
    })
    updateType: NotificationUpdateType;

    /**
     * The new value the user wants to set (email or address string)
     */
    @Column({ type: 'varchar', length: 500, name: 'new_value' })
    newValue: string;

    /**
     * PENDING  → updated but not yet confirmed by admin
     * UPDATED  → successfully applied
     * BLOCKED  → max attempts reached, admin must intervene
     */
    @Column({
        type: 'enum',
        enum: ['PENDING', 'UPDATED', 'BLOCKED'],
        default: 'PENDING',
    })
    status: NotificationUpdateStatus;

    /**
     * How many times this company+agreement+type combo has been updated.
     * Controlled entirely by the backend — never trusted from the client.
     */
    @Column({ type: 'int', default: 0 })
    attempts: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}