import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationUpdate, NotificationUpdateType } from './notification-update.entity';
import { UsersService } from 'src/users/users.service';

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
    ) {}

    // ─────────────────────────────────────────────────────────────
    // PUBLIC: get current update status for a company + agreement
    // ─────────────────────────────────────────────────────────────
    async getStatus(
        company: string,
        agreement: string,
        email: string,
    ): Promise<NotificationStatusResult> {
        const user = await this.usersService.findByEmail(email);
        if (!user) throw new BadRequestException('User not found');

        const result: NotificationStatusResult = { email: null, address: null };

        // Count total records per type — each INSERT = 1 attempt
        for (const type of ['email', 'address'] as NotificationUpdateType[]) {
            const totalAttempts = await this.notificationUpdateRepository.count({
                where: { company, agreement, user_id: user.id, updateType: type },
            });

            if (totalAttempts > 0) {
                // Get the latest record to check current status
                const latest = await this.notificationUpdateRepository.findOne({
                    where: { company, agreement, user_id: user.id, updateType: type },
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

    // ─────────────────────────────────────────────────────────────
    // PUBLIC: attempt to update email or address — always INSERT
    // ─────────────────────────────────────────────────────────────
    async updateNotification(
        company: string,
        agreement: string,
        updateType: NotificationUpdateType,
        newValue: string,
        email: string,
    ): Promise<NotificationUpdateResult> {
        const user = await this.usersService.findByEmail(email);
        if (!user) throw new BadRequestException('User not found');

        // 1. Count how many records already exist for this company + agreement + type
        //    Each row = one update attempt → full audit trail preserved
        const totalAttempts = await this.notificationUpdateRepository.count({
            where: { company, agreement, user_id: user.id, updateType },
        });

        // 2. Already at or over the limit → deny, do NOT insert
        if (totalAttempts >= MAX_ATTEMPTS) {
            throw new ForbiddenException({
                blocked: true,
                message:
                    `You have reached the maximum of ${MAX_ATTEMPTS} updates ` +
                    `for ${updateType === 'email' ? 'email address' : 'physical address'}. ` +
                    `Please contact the administrator to make further changes.`,
                attempts: totalAttempts,
                remaining: 0,
            });
        }

        // 3. Calculate attempt number and status for this new record
        const newAttempts = totalAttempts + 1;
        const newStatus   = newAttempts >= MAX_ATTEMPTS ? 'BLOCKED' : 'UPDATED';

        // 4. Always INSERT a new row — never update existing ones
        await this.notificationUpdateRepository.save({
            company,
            agreement,
            user_id:    user.id,
            updateType,
            newValue,
            status:     newStatus as any,
            attempts:   newAttempts, // sequential number for reference
        });

        // 5. Build response
        const remaining = MAX_ATTEMPTS - newAttempts;
        const typeLabel = updateType === 'email' ? 'email address' : 'physical address';

        return {
            success:  true,
            blocked:  newStatus === 'BLOCKED',
            attempts: newAttempts,
            remaining,
            message:
                newStatus === 'BLOCKED'
                    ? `${typeLabel} updated successfully. You have used all your available updates. ` +
                      `Further changes must be managed by the administrator.`
                    : `${typeLabel} updated successfully. You have ${remaining} update(s) remaining.`,
        };
    }

    // ─────────────────────────────────────────────────────────────
    // ADMIN: force-block a company + agreement + type
    // ─────────────────────────────────────────────────────────────
    async blockNotificationUpdate(
        company: string,
        agreement: string,
        updateType: NotificationUpdateType,
        email: string,
    ) {
        const user = await this.usersService.findByEmail(email);
        if (!user) throw new BadRequestException('User not found');

        const result = await this.notificationUpdateRepository.update(
            { company, agreement, user_id: user.id, updateType },
            { status: 'BLOCKED' },
        );

        return result;
    }

    // ─────────────────────────────────────────────────────────────
    // INTERNAL: read a single record (used by other modules if needed)
    // ─────────────────────────────────────────────────────────────
    async findOne(
        company: string,
        agreement: string,
        updateType: NotificationUpdateType,
        email: string,
    ): Promise<NotificationUpdate | null> {
        const user = await this.usersService.findByEmail(email);
        if (!user) throw new BadRequestException('User not found');

        return this.notificationUpdateRepository.findOne({
            where: { company, agreement, user_id: user.id, updateType },
        });
    }
}