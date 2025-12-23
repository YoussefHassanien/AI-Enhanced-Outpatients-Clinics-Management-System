import { CommonServices, LoggingService } from '@app/common';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { JwtPayload } from '../../../../auth/src/constants';
import { User } from '../../../../auth/src/entities';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
    @Inject(CommonServices.LOGGING) private readonly logger: LoggingService,
  ) {
    const extractAuthenticationCookie = (req: Request): string | null => {
      if (req.signedCookies && req.signedCookies['accessToken']) {
        this.logger.log('Token from signed cookies found');

        return req.signedCookies['accessToken'] as string;
      }

      this.logger.log('No token found');
      return null;
    };

    super({
      jwtFromRequest: extractAuthenticationCookie,
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('ACCESS_TOKEN_SECRET'),
      audience: configService.getOrThrow('AUDIENCE'),
      issuer: configService.getOrThrow('ISSUER'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.authService.getUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException({
        message: 'Incorrect email or password',
      });
    }

    this.logger.log('User fetched');

    return user;
  }
}
