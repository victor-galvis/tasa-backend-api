import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post('register')
  register(@Body() dto: any) {
    return this.usersService.register(dto);
  }

  @Post('add-invoice')
  addInvoice(@Body() body: { userId: number; number: string }) {
    return this.usersService.addInvoice(body.userId, body.number);
  }

  @Post('exists-email')
  async findByEmail(@Body('email') email: string) {
    let response = await this.usersService.findByEmail(email) ? { exists: true } : { exists: false };
    return response;
  }

  @Post('reset-password')
  resetPassword(@Body() body: { email: string; password: string }) {
    return this.usersService.resetPassword(body.email, body.password);
  }
}
