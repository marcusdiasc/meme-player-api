import { User } from 'src/user/schema/user.schema';
export default interface AuthResponse {
    user: Partial<User>;
    token: string;
}
