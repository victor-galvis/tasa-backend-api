import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  register(@Body() dto: any) {
    return this.usersService.register(dto);
  }

  @Post('add-invoice')
  addInvoice(@Body() body: { userId: number; number: string }) {
    return this.usersService.addInvoice(body.userId, body.number);
  }
}
