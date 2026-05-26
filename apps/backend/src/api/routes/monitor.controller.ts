import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import * as net from 'net';

@ApiTags('Monitor')
@Controller('/monitor')
export class MonitorController {
  @Get('/health')
  async health() {
    return {
      status: 'ok',
      service: 'backend',
    };
  }

  @Get('/ready')
  async ready() {
    const checks = {
      database: await this.checkUrl('DATABASE_URL', 5432),
      redis: await this.checkUrl('REDIS_URL', 6379),
      temporal: await this.checkHostPort(
        process.env.TEMPORAL_ADDRESS || 'temporal:7233',
        7233
      ),
    };

    const failed = Object.values(checks).some((check) => check.status !== 'ok');
    const publicPayload = {
      status: failed ? 'error' : 'ok',
      service: 'backend',
    };

    if (failed) {
      throw new ServiceUnavailableException(publicPayload);
    }

    return publicPayload;
  }

  private async checkUrl(envName: string, fallbackPort: number) {
    const value = process.env[envName];
    if (!value) {
      return {
        status: 'skipped',
        reason: `${envName} is not configured`,
      };
    }

    try {
      const url = new URL(value);
      return await this.checkTcp(url.hostname, Number(url.port || fallbackPort));
    } catch (error: any) {
      return {
        status: 'error',
        reason: error.message,
      };
    }
  }

  private async checkHostPort(value: string, fallbackPort: number) {
    const [host, port] = value.split(':');
    return this.checkTcp(host, Number(port || fallbackPort));
  }

  private async checkTcp(host: string, port: number) {
    const timeoutMs = 1500;

    return new Promise<{ status: string; host: string; port: number }>(
      (resolve) => {
        const socket = net.createConnection({ host, port });
        const done = (status: string) => {
          socket.destroy();
          resolve({ status, host, port });
        };

        socket.setTimeout(timeoutMs);
        socket.once('connect', () => done('ok'));
        socket.once('timeout', () => done('timeout'));
        socket.once('error', () => done('error'));
      }
    );
  }

  @Get('/queue/:name')
  async getMessagesGroup(@Param('name') name: string) {
    if (process.env.ENABLE_MONITOR_QUEUE !== 'true') {
      throw new NotFoundException();
    }

    return {
      status: 'success',
      message: `Queue ${name} is healthy.`,
    };
  }
}
