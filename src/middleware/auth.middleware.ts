// src/middleware/auth.middleware.ts

import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/services/user.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService,private readonly userService: UserService,) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const bearerHeader = req.headers.authorization;
    const token = bearerHeader && bearerHeader.split(' ')[1];
   
    if (!bearerHeader || !token) {
        throw new UnauthorizedException('Missing authorization token');
    }

    try {
      const {email} = this.jwtService.verify(token);
      req['user'] = await this.userService.findByEmail(email);  // Menggantikan req.user dengan payload dari token
      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
