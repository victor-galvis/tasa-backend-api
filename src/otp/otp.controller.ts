import { OtpService } from './otp.service';
import { Controller, Post, Body } from '@nestjs/common';

@Controller('otp')
export class OtpController {
    constructor(private readonly otpService: OtpService) { }

    @Post('generate-otp')
    register(@Body() body: { email: string }) {
        return this.otpService.generateOtp(body.email);
    }

    @Post('verify-otp')
    verify(@Body() body: { email: string; code: string }) {
        return this.otpService.verifyOtp(body.email, body.code);
    }

}
