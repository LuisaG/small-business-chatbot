import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class HttpService {
  private readonly logger = new Logger(HttpService.name);

  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const fetchOptions: RequestInit = {
      ...options,
      signal: controller.signal,
    };

    let lastError: Error;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(url, fetchOptions);

        if (response.status === 429 || response.status >= 500) {
          if (attempt < 3) {
            const delay = Math.pow(2, attempt) * 1000;
            this.logger.warn(`HTTP ${response.status} on attempt ${attempt}, retrying in ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        lastError = error as Error;
        if (attempt < 3) {
          const delay = Math.pow(2, attempt) * 1000;
          this.logger.warn(`HTTP request failed on attempt ${attempt}, retrying in ${delay}ms: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    clearTimeout(timeoutId);
    throw lastError;
  }
}
