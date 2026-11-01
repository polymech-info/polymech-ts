import * as reflect from 'reflect-metadata';
import { User } from '../entities/user.entity';
import {
    createRouteParamDecorator,
    PipeTransform
} from '@nestjs/common';

export const UserEntity = createRouteParamDecorator((data, req): User => {
    return req.user;
});
