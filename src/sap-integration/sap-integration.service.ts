import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface SapUpdateEmailPayload {
  comercializadora: string;
  contrato: string;
  email: string;
  digital: boolean;
}

export interface SapUpdateAddressPayload {
  comercializadora: string;
  contrato: string;
  direccion: string;
  municipio: string;
  departamento: string;
}

export interface SapUpdateResponse {
  status: number;
  message: string;
}

@Injectable()
export class SapIntegrationService {
  async updateEmail(
    comercializadora: string,
    contrato: string,
    email: string,
  ): Promise<SapUpdateResponse> {
    if (!comercializadora || !contrato || !email) {
      throw new Error('comercializadora, contrato y email son obligatorios para actualizar en SAP');
    }

    const payload: SapUpdateEmailPayload = {
      comercializadora,
      contrato,
      email,
      digital: true, // siempre true, sin excepciones (decisión #5)
    };

    const config = {
      method: 'put' as const,
      maxBodyLength: Infinity,
      url: process.env.SAP_ENDPOINT_ACTUALIZACION_EMAIL,
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' + Buffer.from(`${process.env.SAP_USER}:${process.env.SAP_PASSWORD}`).toString('base64'),
        Cookie: process.env.SAP_COOKIE,
      },
      data: JSON.stringify(payload),
    };

    try {
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      const err = error as any;
      console.error('Error al actualizar email en SAP:', err.message);
      throw new Error('No se pudo actualizar el email en SAP');
    }
  }

  async updateAddress(
    comercializadora: string,
    contrato: string,
    direccion: string,
    municipio: string,
    departamento: string,
  ): Promise<SapUpdateResponse> {
    if (!comercializadora || !contrato || !direccion || !municipio || !departamento) {
      throw new Error('comercializadora, contrato, direccion, municipio y departamento son obligatorios para actualizar en SAP');
    }

    const payload: SapUpdateAddressPayload = {
      comercializadora,
      contrato,
      direccion,
      municipio,
      departamento,
    };

    const config = {
      method: 'put' as const,
      maxBodyLength: Infinity,
      url: process.env.SAP_ENDPOINT_ACTUALIZACION_DIRECCION,
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' + Buffer.from(`${process.env.SAP_USER}:${process.env.SAP_PASSWORD}`).toString('base64'),
        Cookie: process.env.SAP_COOKIE,
      },
      data: JSON.stringify(payload),
    };

    try {
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      const err = error as any;
      console.error('Error al actualizar dirección en SAP:', err.message);
      throw new Error('No se pudo actualizar la dirección en SAP');
    }
  }
}