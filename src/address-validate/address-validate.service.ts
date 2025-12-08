
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

    async findOneByCompanyAgreementUserAndUpdate(data: any, email: string): Promise<{ isValid: boolean }> {
        const user = await this.userService.findByEmail(email);

        if (!user) {
            throw new Error('User not found');
        }

        const result = await this.addressValidateRepository.findOne({
            where: {
                "company": data.company,
                "agreement": data.agreement,
                "user_id": user.id,
                "correctAddress": data.address,
                "status": "PENDING"
            },
        });
        if (result) {
            result.status = "VALIDATED";
            await this.addressValidateRepository.save(result);
        }
        return { isValid: !!result };
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
                "user_id": user.id,
                "correctAddress": data.address,
                "status": "PENDING"
            },
        });

        return result
    }

}
