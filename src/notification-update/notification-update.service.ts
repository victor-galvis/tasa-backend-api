import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationUpdate, NotificationUpdateType } from './notification-update.entity';
import { UsersService } from 'src/users/users.service';
import { SapIntegrationService } from 'src/sap-integration/sap-integration.service';

export interface NotificationUpdatePayload {
    email?: string;
    direccion?: string;
    municipio?: string;
    departamento?: string;
}

/** Maximum allowed updates per type before the record is BLOCKED */
const MAX_ATTEMPTS = 2;

export interface NotificationUpdateResult {
    success: boolean;
    blocked: boolean;
    message: string;
    attempts: number;
    remaining: number;
}

export interface NotificationStatusResult {
    email: NotificationTypeStatus | null;
    address: NotificationTypeStatus | null;
}

export interface NotificationTypeStatus {
    attempts: number;
    status: string;
    blocked: boolean;
    remaining: number;
}

@Injectable()
export class NotificationUpdateService {
    constructor(
        @InjectRepository(NotificationUpdate)
        private readonly notificationUpdateRepository: Repository<NotificationUpdate>,
        private readonly usersService: UsersService,
        private readonly sapIntegrationService: SapIntegrationService,
    ) {}

    // ─────────────────────────────────────────────────────────────
    // PUBLIC: get current update status for a company + agreement
    // Alcance: company + agreement (SIN user_id) — el límite protege
    // el contrato, sin importar qué usuario del portal lo inscriba.
    // ─────────────────────────────────────────────────────────────
    async getStatus(
        company: string,
        agreement: string,
    ): Promise<NotificationStatusResult> {
        const result: NotificationStatusResult = { email: null, address: null };

        for (const type of ['email', 'address'] as NotificationUpdateType[]) {
            const totalAttempts = await this.notificationUpdateRepository.count({
                where: { company, agreement, updateType: type },
            });

            if (totalAttempts > 0) {
                const latest = await this.notificationUpdateRepository.findOne({
                    where: { company, agreement, updateType: type },
                    order: { id: 'DESC' },
                });

                result[type] = {
                    attempts: totalAttempts,
                    status:   latest?.status ?? 'PENDING',
                    blocked:  totalAttempts >= MAX_ATTEMPTS,
                    remaining: Math.max(0, MAX_ATTEMPTS - totalAttempts),
                };
            }
        }

        return result;
    }

    async updateNotification(
        company: string,
        agreement: string,
        updateType: NotificationUpdateType,
        payload: NotificationUpdatePayload,
        requesterEmail: string,
    ): Promise<NotificationUpdateResult> {
        const user = await this.usersService.findByEmail(requesterEmail);
        if (!user) throw new BadRequestException('User not found');

        // 1. Fail-fast por company+agreement+type (sin user_id)
        const totalAttempts = await this.notificationUpdateRepository.count({
            where: { company, agreement, updateType },
        });

        if (totalAttempts >= MAX_ATTEMPTS) {
            throw new ForbiddenException({
                blocked: true,
                message:
                    `Se alcanzó el máximo de ${MAX_ATTEMPTS} actualizaciones ` +
                    `de ${updateType === 'email' ? 'correo' : 'dirección'} para este contrato. ` +
                    `Contacte al administrador para realizar más cambios.`,
                attempts: totalAttempts,
                remaining: 0,
            });
        }

        // 2. Llamar a SAP — si falla, propaga el error sin insertar nada
        const newValue =
            updateType === 'email' ? (payload.email ?? '') : (payload.direccion ?? '');

        if (updateType === 'email') {
            await this.sapIntegrationService.updateEmail(company, agreement, payload.email ?? '');
        } else {
            await this.sapIntegrationService.updateAddress(
                company,
                agreement,
                payload.direccion ?? '',
                payload.municipio ?? '',
                payload.departamento ?? '',
            );
        }

        // 3. SAP OK -> INSERT auditoría (user_id solo para trazabilidad)
        const newAttempts = totalAttempts + 1;
        const newStatus   = newAttempts >= MAX_ATTEMPTS ? 'BLOCKED' : 'UPDATED';

        await this.notificationUpdateRepository.save({
            company,
            agreement,
            user_id:    user.id,
            updateType,
            newValue,
            status:     newStatus as any,
            attempts:   newAttempts,
        });

        const remaining = MAX_ATTEMPTS - newAttempts;
        const typeLabel = updateType === 'email' ? 'correo' : 'dirección';

        return {
            success:  true,
            blocked:  newStatus === 'BLOCKED',
            attempts: newAttempts,
            remaining,
            message:
                newStatus === 'BLOCKED'
                    ? `${typeLabel} actualizado correctamente en SAP. Se agotaron las actualizaciones disponibles.`
                    : `${typeLabel} actualizado correctamente en SAP. Le quedan ${remaining} actualización(es).`,
        };
    }

    // ─────────────────────────────────────────────────────────────
    // ADMIN: force-block a company + agreement + type
    // ─────────────────────────────────────────────────────────────
    async blockNotificationUpdate(
        company: string,
        agreement: string,
        updateType: NotificationUpdateType,
    ) {
        const result = await this.notificationUpdateRepository.update(
            { company, agreement, updateType },
            { status: 'BLOCKED' },
        );

        return result;
    }

    // ─────────────────────────────────────────────────────────────
    // INTERNAL: read a single record (used by ContractService)
    // ─────────────────────────────────────────────────────────────
    async findOne(
        company: string,
        agreement: string,
        updateType: NotificationUpdateType,
    ): Promise<NotificationUpdate | null> {
        return this.notificationUpdateRepository.findOne({
            where: { company, agreement, updateType },
            order: { id: 'DESC' },
        });
    }
}