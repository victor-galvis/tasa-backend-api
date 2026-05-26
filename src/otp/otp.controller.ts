import { OtpService } from './otp.service';
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { RecaptchaGuard } from '../auth/recaptcha.guard';

@Controller('otp')
export class OtpController {
    constructor(private readonly otpService: OtpService) { }

    @Post('generate-otp')
    @UseGuards(RecaptchaGuard)
    register(@Body() body: { email: string, type: string }) {
        return this.otpService.generateOtp(body.email, body.type);
    }

    @Post('generate-otp-forgot-password')
    @UseGuards(RecaptchaGuard)
    generateOtpForgotPassword(@Body() body: { email: string, type: string }) {
        return this.otpService.generateOtpForgotPassword(body.email, body.type);
    }

    @Post('verify-otp')
    @UseGuards(RecaptchaGuard)
    verify(@Body() body: { email: string; code: string }) {
        return this.otpService.verifyOtp(body.email, body.code);
    }
}