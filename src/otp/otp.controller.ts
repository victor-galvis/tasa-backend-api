import { generate } from 'rxjs';
import { OtpService } from './otp.service';
import { Controller, Post, Body } from '@nestjs/common';

@Controller('otp')
export class OtpController {
    constructor(private readonly otpService: OtpService) { }

    @Post('generate-otp')
    register(@Body() body: { email: string, type: string }) {
        return this.otpService.generateOtp(body.email, body.type);
    }

    @Post('generate-otp-forgot-password')
    generateOtpForgotPassword(@Body() body: { email: string, type: string }) {
        return this.otpService.generateOtpForgotPassword(body.email, body.type);
    }

    @Post('verify-otp')
    verify(@Body() body: { email: string; code: string }) {
        return this.otpService.verifyOtp(body.email, body.code);
    }

}
