// src/employees/external-api.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class ExternalApiService {
  private readonly apiUrl: string;
  private readonly apiSeed: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectPinoLogger(ExternalApiService.name)
    private readonly logger: PinoLogger,
  ) {
    this.apiUrl = this.configService.get<string>('RANDOM_USER_API_URL', '');
    this.apiSeed = this.configService.get<string>('RANDOM_USER_API_SEED', 'default-seed');
  }

  async fetchRawEmployees(count: number = 100): Promise<any[]> {
    const params = {
      results: count,
      seed: this.apiSeed,
      nat: 'us,ca,gb,au',
    };

    this.logger.info({ url: this.apiUrl, params }, 'Fetching raw employee records...');

    try {
      const response = await axios.get(this.apiUrl, { params });
      return response.data.results;
    } catch (error) {
      this.logger.error({ error }, 'Failed to fetch data from external API');
      throw new Error('Could not fetch data from external API.');
    }
  }
}
