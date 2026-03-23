import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { RmqClientModule } from '../messaging/rmq.client.module';
import { GrpcClientModule } from '../grpc/grpc.client.module';

@Module({
  imports: [RmqClientModule, GrpcClientModule],
  controllers: [GatewayController],
})
export class GatewayModule {}
