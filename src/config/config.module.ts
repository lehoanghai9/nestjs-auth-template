import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './configuration';
import { TypedConfigService } from './config.service';

@Module({
   imports: [
      ConfigModule.forRoot({
         load: [configuration],
      }),
   ],
   providers: [TypedConfigService],
   exports: [TypedConfigService],
})
export class TypedConfigModule {}
