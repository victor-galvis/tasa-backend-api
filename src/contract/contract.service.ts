import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
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

// Timeout global para todas las llamadas SAP (ms)
const SAP_TIMEOUT_MS = Number(process.env.SAP_REQUEST_TIMEOUT_MS ?? 20000);

/** Log de tiempo para cada llamada SAP — ayuda a identificar lentitud */
function logSapTiming(operation: string, startMs: number, status?: number | string, identifier?: string) {
  const elapsed = Date.now() - startMs;
  const flag = elapsed > 10000 ? '⚠️ LENTO' : elapsed > 5000 ? '🔶 MEDIO' : '✅ OK';
  const id = identifier ? `-${identifier}` : '';
  console.log(`[SAP][${operation}${id}] ${flag} — ${elapsed}ms${status ? ` — status: ${status}` : ''}`);
}

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

  async findByUser(userId: number) {
    const rows = await this.contractRepository.query(
      `SELECT c.*, co.name AS companyName
      FROM contract c
      LEFT JOIN company co ON co.id = c.company_id
      WHERE c.user_id = ?`,
      [userId],
    );
    return rows.map((r: any) => ({
      ...r,
      deliveryMethod: r.delivery_method,
      companyId: r.company_id,
      provinceId: r.province_id,
      cityId: r.city_id,
      notificationAddress: r.notification_address,
    }));
  }

  async findByNumberAndUser(number: string, user_id: number): Promise<Contract | null> {
    return this.contractRepository.findOne({ where: { number, user_id } });
  }

  async create(data: Partial<Contract> & { address?: string }, requesterEmail: string) {
    const { address, ...contractData } = data;
    const existing = await this.contractRepository.findOne({
      where: {
        user_id: contractData.user_id,
        companyId: contractData.companyId,
        number: contractData.number,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Ya tienes este contrato inscrito. No es posible registrarlo nuevamente.',
      );
    }

    const newContract = this.contractRepository.create(contractData);
    const saved = await this.contractRepository.save(newContract);

    try {
      const comercializadora = String(saved.companyId);
      const contrato = saved.number;

      if (saved.deliveryMethod === 'digital') {
        await this.notificationUpdateService.updateNotification(
          comercializadora, contrato, 'email',
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
          comercializadora, contrato, 'address',
          {
            direccion: address,
            municipio: city.code.slice(-3),
            departamento: province.code,
          },
          requesterEmail,
        );
      }
    } catch (error) {
      const err = error as Error;
      console.error('No se pudo sincronizar la notificación con SAP:', err.message);
      return { ...saved, notificationSyncError: err.message };
    }

    return saved;
  }

  async remove(id: number) {
    await this.contractRepository.delete(id);
    return { message: `Contrato ${id} eliminado correctamente` };
  }

  async update(
    id: number,
    payload: {
      name?: string;
      newAddress?: {
        fullAddress: string;
        cityId: number;
        provinceId: number;
        cityName: string;
        provinceName: string;
        addressKind: 'urban' | 'rural';
      };
    },
    requesterEmail: string,
  ): Promise<Contract> {
    const contract = await this.contractRepository.findOne({ where: { id } });
    if (!contract) throw new NotFoundException(`Contrato ${id} no encontrado`);

    if (payload.name) {
      contract.name = payload.name;
    }

    if (payload.newAddress && contract.deliveryMethod === 'physical') {
      const { fullAddress, cityId, provinceId } = payload.newAddress;
      const city = await this.cityRepository.findOne({ where: { id: cityId } });
      const province = await this.provinceRepository.findOne({ where: { id: provinceId } });

      if (!city || !province) throw new NotFoundException('Municipio o departamento no encontrado');

      await this.notificationUpdateService.updateNotification(
        String(contract.companyId), contract.number, 'address',
        {
          direccion: fullAddress,
          municipio: city.code.slice(-3),
          departamento: province.code,
        },
        requesterEmail,
      );

      contract.notificationAddress = fullAddress;
    }

    return this.contractRepository.save(contract);
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
      timeout: SAP_TIMEOUT_MS,
      url: process.env.SAP_ENDPOINT_VALIDATECONTRACT,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${process.env.SAP_USER}:${process.env.SAP_PASSWORD}`).toString('base64'),
        Cookie: process.env.SAP_COOKIE,
      },
      data,
    };

    const sapStart = Date.now();
    try {
      const response = await axios.request(config);
      logSapTiming('validateContract', sapStart, response.status, filters.agreement);

      if (response.data.data.length > 0) {
        let user = await this.userService.findByEmail(email);
        if (!user) throw new Error('User not found');

        const correctAddress = response.data.data[0].address;
        const randomFakes = Array.from({ length: 4 }, () => this.utils.generateRandomAddress());
        const addresses = this.utils.shuffleArray([...randomFakes, correctAddress]);

        const addressData = {
          company: filters.company,
          agreement: filters.agreement,
          user_id: user.id,
          correctAddress,
          status: 'PENDING',
        };

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
      const err = error as any;
      const isTimeout = err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT';
      logSapTiming('validateContract', sapStart, isTimeout ? 'TIMEOUT' : err.message, filters.agreement);
      console.error('Error al validar contrato:', err.message);
      throw new Error('No se pudo validar el contrato');
    }
  }

  async downloadInvoice(filters: any) {
    const data = JSON.stringify({ filters });
    const config = {
      method: 'get' as const,
      maxBodyLength: Infinity,
      timeout: SAP_TIMEOUT_MS,
      url: process.env.SAP_ENDPOINT_DOWNLOADINVOICE,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${process.env.SAP_USER}:${process.env.SAP_PASSWORD}`).toString('base64'),
        Cookie: process.env.SAP_COOKIE,
      },
      data,
    };

    const sapStart = Date.now();
    try {
      const response = await axios.request(config);
      logSapTiming('downloadInvoice', sapStart, response.status, filters.agreement);
      return response.data;
    } catch (error) {
      const err = error as any;
      const isTimeout = err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT';
      logSapTiming('downloadInvoice', sapStart, isTimeout ? 'TIMEOUT' : err.message, filters.agreement);
      console.error('Error al descargar factura:', err.message);
      throw new Error('No se pudo descargar la factura');
    }
  }

  async pendingPayment(filters: any) {
    const data = JSON.stringify({ filters });
    const config = {
      method: 'get' as const,
      maxBodyLength: Infinity,
      timeout: SAP_TIMEOUT_MS,
      url: process.env.SAP_ENDPOINT_PENDINGPAYMENT,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${process.env.SAP_USER}:${process.env.SAP_PASSWORD}`).toString('base64'),
        Cookie: process.env.SAP_COOKIE,
      },
      data,
    };

    const sapStart = Date.now();
    try {
      const response = await axios.request(config);
      logSapTiming('pendingPayment', sapStart, response.status, filters.agreement);
      return response.data;
    } catch (error) {
      const err = error as any;
      const isTimeout = err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT';
      logSapTiming('pendingPayment', sapStart, isTimeout ? 'TIMEOUT' : err.message, filters.agreement);
      console.error('Error al consultar pagos pendientes:', err.message);
      throw new Error('No se pudo consultar los pagos pendientes');
    }
  }

  async adminDownloadInvoices(company: string | number, agreement: string) {
    const filters = { company, agreement };
    const data = JSON.stringify({ filters });

    const config = {
      method: 'get' as const,
      maxBodyLength: Infinity,
      timeout: SAP_TIMEOUT_MS,
      url: process.env.SAP_ENDPOINT_DOWNLOADINVOICE,
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' +
          Buffer.from(
            `${process.env.SAP_USER}:${process.env.SAP_PASSWORD}`,
          ).toString('base64'),
        Cookie: process.env.SAP_COOKIE,
      },
      data,
    };

    const sapStart = Date.now();
    try {
      const response = await axios.request(config);
      logSapTiming('adminDownloadInvoices', sapStart, response.status, agreement);
      return response.data;
    } catch (error) {
      const err = error as any;
      const isTimeout = err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT';
      logSapTiming(
        'adminDownloadInvoices',
        sapStart,
        isTimeout ? 'TIMEOUT' : err.message,
        agreement,
      );
      console.error('Error admin al consultar facturas:', err.message);
      throw new Error('No se pudo consultar las facturas en SAP');
    }
  }
}