import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Contract } from './contract.entity';
import { Repository } from 'typeorm';
import axios from 'axios';
import { UtilsService } from 'src/utils/utils.service';
import { AddressValidateService } from 'src/address-validate/address-validate.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    private readonly utils: UtilsService,
    private readonly addressValidateService: AddressValidateService,
    private readonly userService: UsersService,

  ) { }

  findAll() {
    return this.contractRepository.find();
  }

  findByUser(userId: number) {
    return this.contractRepository.find({
      where: { user_id: userId },
    });
  }

  async findByNumberAndUser(
    number: string,
    user_id: number,
  ): Promise<Contract | null> {
    return this.contractRepository.findOne({ where: { number, user_id } });
  }

  async create(data: Partial<Contract>) {
    const newContract = this.contractRepository.create(data);
    return await this.contractRepository.save(newContract);
  }

  async remove(id: number) {
    await this.contractRepository.delete(id);
    return { message: `Contrato ${id} eliminado correctamente` };
  }

  async validateContract(filters: any, email: string) {
    const data = JSON.stringify({ filters });
    console.log('Data enviada para validación:', data);
    console.log('Email:', email);


    const config = {
      method: 'get' as const,
      maxBodyLength: Infinity,
      url: process.env.SAP_ENDPOINT_VALIDATECONTRACT,
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' + Buffer.from(`${process.env.SAP_USER}:${process.env.SAP_PASSWORD}`).toString('base64'),
        Cookie:
          process.env.SAP_COOKIE,
      },
      data,
    };

    try {
      const response = await axios.request(config);
      console.log('Respuesta de validación:', filters);
      if (response.data.data.length > 0) {

        let user = await this.userService.findByEmail(email);

        if (!user) {
          throw new Error('User not found');
        }

        const correctAddress = response.data.data[0].address;
        const randomFakes = Array.from({ length: 4 }, () => this.utils.generateRandomAddress());
        const addresses = this.utils.shuffleArray([...randomFakes, correctAddress]);

        //Si existe una validación previa, no crear una nueva actulizarla
        let data = {
          "company": filters.company,
          "agreement": filters.agreement,
          "user_id": user.id,
          "correctAddress": correctAddress,
          "status": "PENDING"
        }
        const resultAddress = await this.addressValidateService.findOneByCompanyAgreementUser({
          company: filters.company,
          agreement: filters.agreement,
        }, email);
        console.log('Existing Validation:', resultAddress);
        if (!resultAddress) {
          this.addressValidateService.create(data);
        }

        return { status: 'OK', addresses };
      } else {
        return { status: 'NOT_FOUND', addresses: [] };
      }
    } catch (error) {
      console.error('Error al validar contrato:', error.message);
      throw new Error('No se pudo validar el contrato');
    }
  }
  async downloadInvoice(filters: any) {
    const data = JSON.stringify({ filters });

    console.log('Data enviada para descarga de factura:', data);

    const config = {
      method: 'get' as const,
      maxBodyLength: Infinity,
      url: process.env.SAP_ENDPOINT_DOWNLOADINVOICE,
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' + Buffer.from(`${process.env.SAP_USER}:${process.env.SAP_PASSWORD}`).toString('base64'),
        Cookie:
          process.env.SAP_COOKIE,
      },
      data,
    };

    try {
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      console.error('Error al validar contrato:', error.message);
      throw new Error('No se pudo validar el contrato');
    }
  }

  async pendingPayment(filters: any) {
    const data = JSON.stringify({ filters });

    const config = {
      method: 'get' as const,
      maxBodyLength: Infinity,
      url: process.env.SAP_ENDPOINT_PENDINGPAYMENT,
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' + Buffer.from(`${process.env.SAP_USER}:${process.env.SAP_PASSWORD}`).toString('base64'),
        Cookie:
          process.env.SAP_COOKIE,
      },
      data,
    };

    try {
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      console.error('Error al validar contrato:', error.message);
      throw new Error('No se pudo validar el contrato');
    }
  }
}
