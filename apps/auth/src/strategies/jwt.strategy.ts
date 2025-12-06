import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../constants';
import { User } from '../entities';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    const extractAuthenticationCookie = (req: Request): string | null => {
      if (req.signedCookies && req.signedCookies['accessToken']) {
        return req.signedCookies['accessToken'] as string;
      }
      return null;
    };

    super({
      jwtFromRequest: extractAuthenticationCookie,
      secretOrKey: configService.getOrThrow<string>('ACCESS_TOKEN_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.authService.getUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException({
        message: 'Incorrect email or password',
      });
    }

    return user;
  }
}
