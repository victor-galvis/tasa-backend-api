import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Contract } from './contract.entity';
import { Repository } from 'typeorm';
import axios from 'axios';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
  ) {}

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

  async validateContract(filters: any) {
    const data = JSON.stringify({ filters });
    console.log('Data enviada para validación:', data);

    const config = {
      method: 'get' as const,
      maxBodyLength: Infinity,
      url: 'http://antuap20.antioquia.local:8000/sap/bc/ztescc_pp/site/ValidacionContrato',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' + Buffer.from('USRWTESCC:ANJO_934P$WT').toString('base64'),
        Cookie:
          'SAP_SESSIONID_QAS_700=fz4Q3FgVsZrKD5IM20U03U56gSi0LRHwkRQAF6R3CK4%3d; sap-usercontext=sap-client=700',
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

  async downloadInvoice(filters: any) {
    const data = JSON.stringify({ filters });

    console.log('Data enviada para descarga de factura:', data);

    const config = {
      method: 'get' as const,
      maxBodyLength: Infinity,
      url: 'http://antuap20.antioquia.local:8000/sap/bc/ztescc_pp/site/DescargaFacturas',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' + Buffer.from('USRWTESCC:ANJO_934P$WT').toString('base64'),
        Cookie:
          'SAP_SESSIONID_QAS_700=fz4Q3FgVsZrKD5IM20U03U56gSi0LRHwkRQAF6R3CK4%3d; sap-usercontext=sap-client=700',
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
      url: 'http://antuap20.antioquia.local:8000/sap/bc/ztescc_pp/site/PendientePagar',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' + Buffer.from('USRWTESCC:ANJO_934P$WT').toString('base64'),
        Cookie:
          'SAP_SESSIONID_QAS_700=fz4Q3FgVsZrKD5IM20U03U56gSi0LRHwkRQAF6R3CK4%3d; sap-usercontext=sap-client=700',
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
