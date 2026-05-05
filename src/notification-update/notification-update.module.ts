import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationUpdateService } from './notification-update.service';
import { NotificationUpdateController } from './notification-update.controller';
import { NotificationUpdate } from './notification-update.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([NotificationUpdate]),
        UsersModule,   // reuses UsersService.findByEmail — same as address-validate
    ],
    controllers: [NotificationUpdateController],
    providers:   [NotificationUpdateService],
    exports:     [NotificationUpdateService],  // export in case other modules need it
})
export class NotificationUpdateModule {}