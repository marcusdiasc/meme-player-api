import { Controller, Get, Param } from '@nestjs/common';
import { User } from './schema/user.schema';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/:username/profile')
  async getUserProfile(@Param('username') username: string): Promise<User> {
    return this.userService.getUserProfile(username);
  }
}
