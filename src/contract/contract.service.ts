import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Contract } from './contract.entity';
import { Repository } from 'typeorm';
import axios from 'axios';
import { UtilsService } from 'src/utils/utils.service';
import { AddressValidateService } from 'src/address-validate/address-validate.service';
import { UsersService } from 'src/users/users.service';
import { NotificationUpdateService } from 'src/notification-update/notification-update.service';
import { City } from 'src/cities/cities.entity';
import { Province } from 'src/provinces/province.entity';

@Injectable()
export class ContractService {
  private validateCache = new Map<string, { result: any; timestamp: number }>();
  private readonly CACHE_TTL = 30_000; // 30 segundos

  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
    @InjectRepository(Province)
    private readonly provinceRepository: Repository<Province>,
    private readonly utils: UtilsService,
    private readonly addressValidateService: AddressValidateService,
    private readonly userService: UsersService,
    private readonly notificationUpdateService: NotificationUpdateService,
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

  async create(data: Partial<Contract> & { address?: string }, requesterEmail: string) {
    const { address, ...contractData } = data;

    const newContract = this.contractRepository.create(contractData);
    const saved = await this.contractRepository.save(newContract);

    try {
      const comercializadora = String(saved.companyId);
      const contrato = saved.number;

      if (saved.deliveryMethod === 'digital') {
        await this.notificationUpdateService.updateNotification(
          comercializadora,
          contrato,
          'email',
          { email: requesterEmail },
          requesterEmail,
        );
      } else {
        const city = await this.cityRepository.findOne({ where: { id: saved.cityId } });
        const province = await this.provinceRepository.findOne({ where: { id: saved.provinceId } });

        if (!city || !province) {
          throw new Error('No se encontró el municipio o departamento del contrato para sincronizar con SAP');
        }

        await this.notificationUpdateService.updateNotification(
          comercializadora,
          contrato,
          'address',
          {
            direccion: address,
            municipio: city.code,
            departamento: province.code,
          },
          requesterEmail,
        );
      }
    } catch (error) {
      const err = error as Error;
      console.error('No se pudo sincronizar la notificación con SAP:', err.message);
      // El contrato queda creado igual (decisión sección 5 #1) — se avisa al frontend.
      return { ...saved, notificationSyncError: err.message };
    }

    return saved;
  }

  async remove(id: number) {
    await this.contractRepository.delete(id);
    return { message: `Contrato ${id} eliminado correctamente` };
  }

  async validateContract(filters: any, email: string) {
    const cacheKey = `${filters.company}-${filters.agreement}-${email}`;
    const cached = this.validateCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`[CACHE HIT] validateContract ${cacheKey}`);
      return cached.result;
    }

    const data = JSON.stringify({ filters });

    const resultAddress = await this.addressValidateService.findOneByCompanyAgreementUser({
      company: filters.company,
      agreement: filters.agreement,
    }, email);

    const maxAttempts = Number(process.env.ATTEMPTS_VALIDATECONTRACT ?? '0');

    if (resultAddress && resultAddress.attempts >= maxAttempts) {
      await this.addressValidateService.blockAddressValidate({
        company: filters.company,
        agreement: filters.agreement,
      }, email);

      const maxAttemptsResult = {
        status: 'MAX_ATTEMPTS',
        message: 'Ha superado el número máximo de intentos. El contrado fue bloqueado'
      };
      this.validateCache.set(cacheKey, { result: maxAttemptsResult, timestamp: Date.now() });
      return maxAttemptsResult;
    }

    const config = {
      method: 'get' as const,
      maxBodyLength: Infinity,
      url: process.env.SAP_ENDPOINT_VALIDATECONTRACT,
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' + Buffer.from(`${process.env.SAP_USER}:${process.env.SAP_PASSWORD}`).toString('base64'),
        Cookie: process.env.SAP_COOKIE,
      },
      data,
    };

    try {
      const response = await axios.request(config);
      if (response.data.data.length > 0) {

        let user = await this.userService.findByEmail(email);

        if (!user) {
          throw new Error('User not found');
        }

        const correctAddress = response.data.data[0].address;
        const randomFakes = Array.from({ length: 4 }, () => this.utils.generateRandomAddress());
        const addresses = this.utils.shuffleArray([...randomFakes, correctAddress]);

        const addressData = {
          company: filters.company,
          agreement: filters.agreement,
          user_id: user.id,
          correctAddress: correctAddress,
          status: 'PENDING',
        };
        console.log('filters', filters);
        console.log('resultAddress', resultAddress);

        if (!resultAddress) {
          await this.addressValidateService.create(addressData);
        }

        const okResult = { status: 'OK', addresses };
        this.validateCache.set(cacheKey, { result: okResult, timestamp: Date.now() });
        return okResult;
      } else {
        const notFoundResult = { status: 'NOT_FOUND', addresses: [] };
        this.validateCache.set(cacheKey, { result: notFoundResult, timestamp: Date.now() });
        return notFoundResult;
      }
    } catch (error) {
      const err = error as Error;
      console.error('Error al validar contrato:', err.message);
      throw new Error('No se pudo validar el contrato');
    }
  }
  async downloadInvoice(filters: any) {
    const data = JSON.stringify({ filters });

    const config = {
      method: 'get' as const,
      maxBodyLength: Infinity,
      url: process.env.SAP_ENDPOINT_DOWNLOADINVOICE,
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' + Buffer.from(`${process.env.SAP_USER}:${process.env.SAP_PASSWORD}`).toString('base64'),
        Cookie: process.env.SAP_COOKIE,
      },
      data,
    };

    try {
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      const err = error as Error;
      console.error('Error al descargar factura:', err.message);
      throw new Error('No se pudo descargar la factura');
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
        Cookie: process.env.SAP_COOKIE,
      },
      data,
    };

    try {
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      const err = error as Error;
      console.error('Error al consultar pagos pendientes:', err.message);
      throw new Error('No se pudo consultar los pagos pendientes');
    }
  }
}