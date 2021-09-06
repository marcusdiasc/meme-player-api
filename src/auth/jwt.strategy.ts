import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User, UserDocument } from 'src/user/schema/user.schema';
import { UserService } from 'src/user/user.service';
import JwtPayload from './interface/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'Topsecret51',
    });
  }

  async validate(payload: JwtPayload): Promise<UserDocument> {
    const { userId } = payload;
    const user = await this.userService.findById(userId);
    return user;
  }
}
