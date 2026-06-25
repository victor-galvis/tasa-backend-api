import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ContractService } from './contract.service';
import { Contract } from './contract.entity';
import { jwtDecode } from 'jwt-decode';
import { ValidateContractRateLimitGuard } from './rate-limit.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AddressValidateService } from 'src/address-validate/address-validate.service';

@Controller('contract')
export class ContractController {
  constructor(
    private readonly contractService: ContractService,
    private readonly addressValidateService: AddressValidateService, // ← agregar
  ) {}

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
    data.created_at = new Date();
    return this.contractService.create(data);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.contractService.remove(id);
  }

  @UseGuards(JwtAuthGuard, ValidateContractRateLimitGuard)
  @Post('validate')
  async validateContract(@Body() body: any, @Req() req) {
    const auth = req.headers['authorization'];
    const token = auth?.split(' ')[1];
    const payload = jwtDecode<{ email: string }>(token);
    return this.contractService.validateContract(body.filters, payload.email);
  }

  @Post('download-invoices')
  async downloadContract(@Body() body: any) {
    return this.contractService.downloadInvoice(body.filters);
  }

  @Post('pending-payments')
  async pendingPayments(@Body() body: any) {
    return this.contractService.pendingPayment(body.filters);
  }

  // ── Admin endpoints ────────────────────────────────────────
  @UseGuards(AdminGuard)
  @Get('blocked')
  getBlockedContracts() {
    return this.addressValidateService.findBlocked();
  }

  @UseGuards(AdminGuard)
  @Delete('unblock/:id')
  unblockById(@Param('id') id: number) {
    return this.addressValidateService.deleteById(id);
  }
}