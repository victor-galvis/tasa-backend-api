import { Module } from '@nestjs/common';
import { DocumentTypesService } from './document-types.service';
import { DocumentTypesController } from './document-types.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentTypes } from './document-types.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentTypes])],

  providers: [DocumentTypesService],
  controllers: [DocumentTypesController],
})
export class DocumentTypesModule {}
