import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RecaptchaGuard } from './recaptcha.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @UseGuards(RecaptchaGuard)
    login(@Body() body: { email: string; password: string }) {
        return this.authService.login(body.email, body.password);
    }
}