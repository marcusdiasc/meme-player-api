import { ConfigService } from '@nestjs/config';
import { UserDocument } from 'src/user/schema/user.schema';
import { UserService } from 'src/user/user.service';
import JwtPayload from './interface/jwt-payload.interface';
declare const JwtStrategy_base: new (...args: any[]) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    private userService;
    private configService;
    constructor(userService: UserService, configService: ConfigService);
    validate(payload: JwtPayload): Promise<UserDocument>;
}
export {};
