// src/employees/exceptions/external-api-failed.exception.ts

import { InternalServerErrorException } from '@nestjs/common';

export class ExternalApiFailedException extends InternalServerErrorException {
  constructor(message: string) {
    super(`Failed to fetch data from external API: ${message}`);
  }
}