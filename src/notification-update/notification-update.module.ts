import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationUpdateService } from './notification-update.service';
import { NotificationUpdateController } from './notification-update.controller';
import { NotificationUpdate } from './notification-update.entity';
import { UsersModule } from 'src/users/users.module';
import { SapIntegrationModule } from 'src/sap-integration/sap-integration.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([NotificationUpdate]),
        UsersModule,
        SapIntegrationModule,
    ],
    controllers: [NotificationUpdateController],
    providers:   [NotificationUpdateService],
    exports:     [NotificationUpdateService],
})
export class NotificationUpdateModule {}