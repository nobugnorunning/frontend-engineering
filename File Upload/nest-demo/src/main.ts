import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { port } from '../../configs.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true, bodyParser: true });

  app.setGlobalPrefix('/api');

  await app.listen(process.env.PORT ?? port);
}
bootstrap();
