import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsPhoneNumber, IsStrongPassword } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export abstract class BaseStaffDto extends CreateUserDto {
  @ApiProperty({
    description: 'User email',
    example: 'John@gmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User mobile phone number',
    example: '+201015411320',
  })
  @IsPhoneNumber('EG')
  phone: string;

  @ApiProperty({
    description: 'User password',
    example: 'StrongPassword123!',
    minLength: 8,
  })
  @IsStrongPassword()
  password: string;
}
