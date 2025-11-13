import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ContractService } from './contract.service';
import { Contract } from './contract.entity';

@Controller('contract')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Get()
  findAll() {
    return this.contractService.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: number) {
    return this.contractService.findByUser(userId);
  }

  @Post()
  async create(@Body() data: Partial<Contract>) {
    const exists = await this.contractService.findByNumberAndUser(
      data.number!,
      data.user_id!,
    );
    if (exists) {
      throw new BadRequestException('El contrato ya está inscrito.');
    }

    data.created_at = new Date();
    return this.contractService.create(data);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.contractService.remove(id);
  }

  @Post('validate')
  async validateContract(@Body() body: any) {
    return this.contractService.validateContract(body.filters);
  }

  @Post('download-invoices')
  async downloadContract(@Body() body: any) {
    return this.contractService.downloadInvoice(body.filters);
  }

  @Post('pending-payments')
  async pendingPayments(@Body() body: any) {
    return this.contractService.pendingPayment(body.filters);
  }
}
