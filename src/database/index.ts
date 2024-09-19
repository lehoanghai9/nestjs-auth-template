import { RefreshTokenEntity } from './refresh-token.entity';
import { ResetTokenEntity } from './reset-token.entity';
import { UserEntity } from './user.entity';

export { UserEntity };

const entities = [UserEntity, RefreshTokenEntity, ResetTokenEntity];
export default entities;
