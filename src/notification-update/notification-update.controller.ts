import {
    Controller,
    Post,
    Get,
    Body,
    Query,
    Req,
    HttpCode,
} from '@nestjs/common';
import { NotificationUpdateService } from './notification-update.service';
import { NotificationUpdateType } from './notification-update.entity';
import { jwtDecode } from 'jwt-decode';

interface UpdateNotificationBody {
    company:    string;
    agreement:  string;
    updateType: NotificationUpdateType;
    newValue:   string;                 
}

interface BlockNotificationBody {
    company:    string;
    agreement:  string;
    updateType: NotificationUpdateType;
}

@Controller('notification-update')
export class NotificationUpdateController {
    constructor(
        private readonly notificationUpdateService: NotificationUpdateService,
    ) {}

    // ─────────────────────────────────────────────────────────────
    // GET /notification-update/status?company=14&agreement=4155
    // Alcance company+agreement — ya no depende del usuario logueado
    // ─────────────────────────────────────────────────────────────
    @Get('status')
    async getStatus(@Query() query: { company: string; agreement: string }) {
        return this.notificationUpdateService.getStatus(
            query.company,
            query.agreement,
        );
    }

    // ─────────────────────────────────────────────────────────────
    // POST /notification-update
    // Attempt to update email or physical address
    // Body: { company, agreement, updateType, newValue }
    // user_id se sigue resolviendo del JWT, pero solo para auditoría
    // ─────────────────────────────────────────────────────────────
    @Post()
    @HttpCode(200)
    async update(@Body() body: UpdateNotificationBody, @Req() req) {
        const email = this.extractEmail(req);
        return this.notificationUpdateService.updateNotification(
            body.company,
            body.agreement,
            body.updateType,
            body.newValue,
            email,
        );
    }

    // ─────────────────────────────────────────────────────────────
    // POST /notification-update/block  (admin use)
    // Force-blocks a company + agreement for a given update type
    // ─────────────────────────────────────────────────────────────
    @Post('block')
    @HttpCode(200)
    async block(@Body() body: BlockNotificationBody) {
        return this.notificationUpdateService.blockNotificationUpdate(
            body.company,
            body.agreement,
            body.updateType,
        );
    }

    // ─────────────────────────────────────────────────────────────
    // Shared helper — same pattern you use in address-validate
    // ─────────────────────────────────────────────────────────────
    private extractEmail(req: any): string {
        const auth  = req.headers['authorization'];
        const token = auth?.split(' ')[1];
        const payload = jwtDecode<{ email: string }>(token);
        return payload.email;
    }
}