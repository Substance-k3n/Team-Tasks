import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { RmqClientModule } from '../messaging/rmq.client.module';

@Module({
  imports: [RmqClientModule],
  controllers: [GatewayController],
})
export class GatewayModule {}
