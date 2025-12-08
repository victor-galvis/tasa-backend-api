


import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { AddressValidateService } from './address-validate.service';
import { AddressValidate } from './address-validate.entity';
import { jwtDecode } from 'jwt-decode';

@Controller('address-validate')
export class AddressValidateController {
  constructor(
    private readonly addressValidateService: AddressValidateService,
  ) { }

  @Post()
  async create(@Body() data: AddressValidate, @Req() req) {
    return this.addressValidateService.create(data);
  }

  @Post('/validate')
  async findOne(@Body() data, @Req() req) {
    const auth = req.headers['authorization'];
    const token = auth?.split(' ')[1];
    const payload = jwtDecode<{ email: string }>(token);
    req.res.status(200);
    return this.addressValidateService.findOneByCompanyAgreementUserAndUpdate(
      data, payload.email
    );
  }
}
