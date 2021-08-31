import { Equals, IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export default class SignUpDto {
  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  passwordOne: string;

  @IsNotEmpty()
  @MinLength(6)
  passwordTwo: string;
}
