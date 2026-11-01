import * as reflect from 'reflect-metadata';

import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
    UseGuards,
    Request,
    Headers,
    Session,
    createRouteParamDecorator,
    Component,
    INestApplicationContext,
    PipeTransform


} from '@nestjs/common';

import { ApiBearerAuth, ApiImplicitParam, ApiImplicitQuery, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';

import { Roles } from '../decorators/roles.decorator';
import { InDeviceDto } from '../dto/in-device.dto';
import { OutDeviceDto } from '../dto/out-device.dto';
import { OutDevicesDto } from '../dto/out-devices.dto';
import { Device } from '../entities/device.entity';
import { AccessGuard } from '../guards/access.guard';
import { ParseIntWithDefaultPipe } from '../pipes/parse-int-with-default.pipe';
import { Permissions } from '../decorators/permissions.decorator';
import { User } from '../entities/user.entity';
import * as debug from '../log';
import { COMMANDS, after } from '../shared'
import { EventsGateway } from './events.gateway';
import { EventEmitter } from 'events';

export const UserEntity = createRouteParamDecorator((data, req): any => {
    return req.user;
});

export class BaseController extends EventEmitter {
    /*private readonly ws: EventsGateway;*/
    constructor(
    ) {
        super();
        // console.log('ctor ', Reflect.getMetadata('path', DevicesController));
    }
    public broadcast(key: string, data: any) {
        const ws = this['ws'] as EventsGateway;
        ws.broadcast(key, data);
    }
}