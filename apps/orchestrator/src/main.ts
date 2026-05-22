import { initializeSentry } from '@gitroom/nestjs-libraries/sentry/initialize.sentry';
initializeSentry('orchestrator', true);
import 'source-map-support/register';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

import { NestFactory } from '@nestjs/core';
import * as dns from 'node:dns';
import express = require('express');
import { NextFunction, Request, Response } from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
dns.setDefaultResultOrder('ipv4first');

type BootstrapStatus = 'starting' | 'ready' | 'error';

async function bootstrap() {
  const port = Number(process.env.ORCHESTRATOR_PORT || 3002);
  let bootstrapStatus: BootstrapStatus = 'starting';
  let bootstrapError: string | undefined;
  const server = express();

  server.get(
    '/health/status',
    (_req: Request, res: Response, next: NextFunction) => {
      if (bootstrapStatus === 'ready') {
        return next();
      }

      return res
        .status(bootstrapStatus === 'error' ? 500 : 200)
        .json({ status: bootstrapStatus, error: bootstrapError });
    }
  );

  const httpServer = server.listen(port, () => {
    console.log(`Orchestrator health check listening on port ${port}`);
  });

  try {
    const { AppModule } = await import('./app.module');
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
    app.enableShutdownHooks();
    await app.init();
    bootstrapStatus = 'ready';
    console.log(`Orchestrator application initialized on port ${port}`);
  } catch (error) {
    bootstrapStatus = 'error';
    bootstrapError = error instanceof Error ? error.message : String(error);
    console.error('Orchestrator failed to initialize', error);
    httpServer.close(() => process.exit(1));
    setTimeout(() => process.exit(1), 5000).unref();
  }
}


bootstrap();
