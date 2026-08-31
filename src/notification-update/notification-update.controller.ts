import {
    Controller,
    Post,
    Get,
    Body,
    Query,
    Param,
    Req,
    HttpCode,
} from '@nestjs/common';
import { NotificationUpdateService } from './notification-update.service';
import { NotificationUpdateType } from './notification-update.entity';
import { jwtDecode } from 'jwt-decode';

interface UpdateNotificationBody {
    company:      string;
    agreement:    string;
    updateType:   NotificationUpdateType;
    email?:       string;
    direccion?:   string;
    municipio?:   string;
    departamento?: string;
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
    // ─────────────────────────────────────────────────────────────
    @Get('status')
    async getStatus(@Query() query: { company: string; agreement: string }) {
        return this.notificationUpdateService.getStatus(
            query.company,
            query.agreement,
        );
    }

    // ─────────────────────────────────────────────────────────────
    // GET /notification-update/attempts/:company/:agreement
    // Usado por el frontend (edit-contract-modal) para saber cuántos
    // intentos se han consumido y mostrar/bloquear los controles.
    // Devuelve: { emailAttempts: number, addressAttempts: number }
    // ─────────────────────────────────────────────────────────────
    @Get('attempts/:company/:agreement')
    async getAttempts(
        @Param('company') company: string,
        @Param('agreement') agreement: string,
    ) {
        const status = await this.notificationUpdateService.getStatus(company, agreement);
        return {
            emailAttempts:   status.email?.attempts   ?? 0,
            addressAttempts: status.address?.attempts ?? 0,
        };
    }

    // ─────────────────────────────────────────────────────────────
    // POST /notification-update
    // ─────────────────────────────────────────────────────────────
    @Post()
    @HttpCode(200)
    async update(@Body() body: UpdateNotificationBody, @Req() req) {
        const email = this.extractEmail(req);
        return this.notificationUpdateService.updateNotification(
            body.company,
            body.agreement,
            body.updateType,
            {
                email:       body.email,
                direccion:   body.direccion,
                municipio:   body.municipio,
                departamento: body.departamento,
            },
            email,
        );
    }

    // ─────────────────────────────────────────────────────────────
    // POST /notification-update/block  (admin)
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

    private extractEmail(req: any): string {
        const auth  = req.headers['authorization'];
        const token = auth?.split(' ')[1];
        const payload = jwtDecode<{ email: string }>(token);
        return payload.email;
    }
}