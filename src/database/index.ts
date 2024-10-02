import { CustomerEntity } from './customer.entity';
import { PriceEntity } from './price.entity';
import { ProductEntity } from './product.entity';
import { RefreshTokenEntity } from './refresh-token.entity';
import { ResetTokenEntity } from './reset-token.entity';
import { SubscriptionEntity } from './subscription.entity';
import { UserEntity } from './user.entity';

export { UserEntity };

const entities = [
   UserEntity,
   RefreshTokenEntity,
   ResetTokenEntity,
   ProductEntity,
   PriceEntity,
   CustomerEntity,
   SubscriptionEntity,
];




export default entities;
