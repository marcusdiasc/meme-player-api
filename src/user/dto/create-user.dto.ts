import { IsNotEmpty, IsEmail } from 'class-validator';

export default class CreateUserDto {
  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}
