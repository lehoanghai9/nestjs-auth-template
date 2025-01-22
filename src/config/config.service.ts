import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { IConfigVariables } from './configuration';

@Injectable()
export class TypedConfigService {
   constructor(private configService: NestConfigService) {}

   get<T extends Leaves<IConfigVariables>>(
      propertyPath: T,
   ): LeafTypes<IConfigVariables, T> {
      return this.configService.get(propertyPath);
   }
}

type Leaves<T> = T extends object
   ? {
        [K in keyof T]: `${Exclude<K, symbol>}${Leaves<T[K]> extends never
           ? ''
           : `.${Leaves<T[K]>}`}`;
     }[keyof T]
   : never;

export type LeafTypes<T, S extends string> = S extends `${infer T1}.${infer T2}`
   ? T1 extends keyof T
      ? LeafTypes<T[T1], T2>
      : never
   : S extends keyof T
     ? T[S]
     : never;
