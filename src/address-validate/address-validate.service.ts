
import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddressValidate } from './address-validate.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AddressValidateService {

    constructor(
        @InjectRepository(AddressValidate)
        private readonly addressValidateRepository: Repository<AddressValidate>,
        private readonly userService: UsersService,
    ) { }


    async create(data: any) {
        const saved = await this.addressValidateRepository.save(data);
        return saved;
    }

    async findOneByCompanyAgreementUserAndUpdate(
        data: any,
        email: string
    ): Promise<{ isValid: boolean }> {

        const user = await this.userService.findByEmail(email);
        if (!user) {
            throw new Error('User not found');
        }

        const address = await this.addressValidateRepository.findOne({
            where: {
                "company": data.company,
                "agreement": data.agreement,
                "user_id": user.id
            },
        });
        const maxAttempts = Number(process.env.ATTEMPTS_VALIDATECONTRACT ?? '0');
        if (!address || address.attempts >= maxAttempts) {
            return { isValid: false, message: 'Ha superado el número máximo de intentos' } as any;
        }

        const isValid = address.correctAddress === data.address;

        const result = await this.addressValidateRepository.update({
            company: data.company,
            agreement: data.agreement,
            user_id: user.id
        }, {
            status: isValid ? 'VALIDATED' : 'PENDING',
            attempts: () => 'attempts + 1',
        });
        console.log('result => ', result);
        console.log('isValid => ', isValid);

        //Necesito retornar los intentos restantes en un mensaje hazlo copilot
        const remainingAttempts = maxAttempts - (address?.attempts || 0);
        return { isValid, message: isValid ? 'Dirección validada correctamente' : `Dirección no validada. Intentos restantes: ${remainingAttempts}` } as any;
    }

    async blockAddressValidate(data: any, email: string) {
        const user = await this.userService.findByEmail(email);
        if (!user) {
            throw new Error('User not found');
        }
        const result = await this.addressValidateRepository.update({
            company: data.company,
            agreement: data.agreement,
            user_id: user.id
        }, {
            status: 'BLOCKED',
        });
        return result;
    }

    async findOneByCompanyAgreementUser(data: any, email: string) {
        const user = await this.userService.findByEmail(email);

        if (!user) {
            throw new Error('User not found');
        }

        const result = await this.addressValidateRepository.findOne({
            where: {
                "company": data.company,
                "agreement": data.agreement,
                "user_id": user.id
            },
        });

        return result
    }

}
