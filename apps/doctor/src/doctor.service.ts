import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Labs, Medications, Scans, Visits } from './entities';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Labs)
    private readonly labsRepository: Repository<Labs>,
    @InjectRepository(Visits)
    private readonly visitsRepository: Repository<Visits>,
    @InjectRepository(Medications)
    private readonly medicationsRepository: Repository<Medications>,
    @InjectRepository(Scans)
    private readonly scansRepository: Repository<Scans>,
  ) {}
  isUp(): string {
    return 'Auth service is up';
  }
}
