import { Controller, Get, Param } from '@nestjs/common';
import { CompanyService } from './company.service';
import { Company } from './company.entity';

@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('')
  async findCompanies(): Promise<Company[]> {
    return this.companyService.findAll();
  }
}
