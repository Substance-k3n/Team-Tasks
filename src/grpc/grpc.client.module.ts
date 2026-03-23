import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  INTERNAL_GRPC_PACKAGE,
  INTERNAL_PROTO_PATH,
} from './grpc.constants';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'INTERNAL_TASKS_GRPC_CLIENT',
        transport: Transport.GRPC,
        options: {
          package: INTERNAL_GRPC_PACKAGE,
          protoPath: INTERNAL_PROTO_PATH,
          url: process.env.INTERNAL_GRPC_URL || 'localhost:50051',
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class GrpcClientModule {}
