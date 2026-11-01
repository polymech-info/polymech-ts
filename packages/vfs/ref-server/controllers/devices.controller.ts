import * as reflect from 'reflect-metadata';
import * as lodash from 'lodash';
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
    OnModuleInit


} from '@nestjs/common';

import { ApiBearerAuth, ApiImplicitParam, ApiImplicitQuery, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository, DeleteResult } from 'typeorm';

import { Roles } from '../decorators/roles.decorator';
import { InDeviceDto } from '../dto/in-device.dto';
import { OutDeviceDto } from '../dto/out-device.dto';
import { OutDevicesDto } from '../dto/out-devices.dto';
import { Device } from '../entities/device.entity';
import { AccessGuard } from '../guards/access.guard';
import { ParseIntWithDefaultPipe } from '../pipes/parse-int-with-default.pipe';
import { Permissions } from '../decorators/permissions.decorator';
import { User } from '../entities/user.entity';
import { COMMANDS, after, before, around, SIGNALS } from '../shared';
import * as debug from '../log';
import { EventsGateway } from './events.gateway';
import { BaseController } from './base.controller';
import { UserEntity } from './utils';
import { ContextManager } from './ContextManager';
import { UsersController } from './users.controller';
import { ModuleRef } from '@nestjs/core';
import { isArray } from 'util';
import { DEVICE_STATE, DEVICE_FLAGS, LOGGING_FLAGS, DefaultCommandSettings, DefaultSettings } from '../shared/types';
import { DeviceDto } from '../dto/device.dto';
import { isString } from '@xblox/core/primitives';
@ApiUseTags('devices')
@ApiBearerAuth()
@Controller('/api/devices')
@UseGuards(AccessGuard)
export class DevicesController extends BaseController implements OnModuleInit {
    private contextManager: ContextManager;
    constructor(
        @InjectRepository(Device)
        private readonly repository: Repository<Device>,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private readonly ws: EventsGateway
        /*private readonly userService:UsersController*/
    ) {
        super();
        this.contextManager = new ContextManager();
        // console.log('ctor ', Reflect.getMetadata('path', DevicesController));
    }

    async users() {
        const _users = await this.usersRepository.findAndCount({
            id: 1,
            isActive: true
        });
        return _users[0];
    }

    async boot() {

        let _devices: [Device[], number] = await this.repository.findAndCount({
            isActive: true
        });
        let devices = _devices['0'];

        // debug.inspect('Module initialized...', devices);
        const users = await this.users();
        // debug.inspect('Module initialized...users', users);
        users.forEach((user: User) => {
            let ctx = this.contextManager.context(user, this.ws);
            let userDevices = lodash.find(devices, {
                user: user.id,
                isActive: true
            });

            if (userDevices && !isArray(userDevices)) {
                userDevices = [userDevices];
            }
            if (!userDevices) {
                debug.warn('user ' + user.email + ' has no devices');
                return;
            }
            // debug.inspect('start user devices ', userDevices);
            userDevices.forEach((device) => {
                ctx.start(device);
            })
        });
    }
    async onModuleInit() {
        const log = (what: any) => {
            for (var p in what) {
                if (typeof what[p] !== 'function') {
                    if (typeof what[p] === 'object') {
                        log(what[p]);
                    }
                }
            }
        }
        // log(this);
        return await this.boot();
    }

    //////////////////////////////////////
    //
    // Devices logic
    //

    @Permissions(COMMANDS.START_DEVICE)
    @HttpCode(HttpStatus.CREATED)
    @ApiResponse({
        status: HttpStatus.CREATED, type: OutDeviceDto,
        description: 'The item has been successfully started'
    })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
    @ApiImplicitParam({ name: 'id', type: Number })
    @Post('/start/:id')
    /*
    @after((context, args, b) => {
        console.log('after: ', [args, b]);
    })
    @around((context, args, b) => {
        console.log('around: ', [args, b]);
    })
    */
    start(
        @Param('id', new ParseIntPipe()) id,
        @UserEntity() user: any
    ) {
        try {
            return new Promise<Device>((resolve, reject) => {
                this.repository.findOneOrFail(
                    id
                ).then((object) => {
                    object.isActive = true;
                    let ctx = this.contextManager.context(user, this.ws);
                    if (!isString(object.logging)) {
                        object.logging = JSON.stringify(object.logging, null, 2);
                    }
                    let saved = this.repository.save(object);
                    this.emit(COMMANDS.START_DEVICE, object, user);
                    ctx.start(object).then((device: Device) => {
                        this.broadcast(COMMANDS.DEVICE_UPDATE, {
                            ...device,
                            user
                        });
                        this.repository.save(device);
                        resolve(device);
                    });
                });

            });
        } catch (error) {
            throw error;
        }
    }

    @Permissions(COMMANDS.START_DEVICE)
    @HttpCode(HttpStatus.CREATED)
    @ApiResponse({
        status: HttpStatus.CREATED, type: OutDeviceDto,
        description: 'The item has been successfully stopped'
    })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
    @ApiImplicitParam({ name: 'id', type: Number })
    @Post('/stop/:id')
    stop(
        @Param('id', new ParseIntPipe()) id,
        @UserEntity() user: any
    ) {

        try {
            return new Promise<Device>((resolve, reject) => {
                this.repository.findOneOrFail(
                    id
                ).then((object) => {
                    object.isActive = false;
                    let ctx = this.contextManager.context(user, this.ws);
                    if (!isString(object.logging)) {
                        object.logging = JSON.stringify(object.logging, null, 2);
                    }   
                    let saved = this.repository.save(object);
                    this.emit(COMMANDS.STOP_DEVICE, object, user);
                    ctx.stop(object).then((device: Device) => {
                        device.state = DEVICE_STATE.DISCONNECTED;
                        this.broadcast(COMMANDS.DEVICE_UPDATE, {
                            ...device,
                            user
                        });
                        this.repository.save(device);
                        resolve(device);
                    });
                });

            });
        } catch (error) {
            throw error;
        }
        /*
        try {
            let object: Device = await this.repository.findOneOrFail(
                id
            );
            object.isActive = false;
            let ctx = this.contextManager.context(user, this.ws);
            ctx.stop(object);
            this.emit(COMMANDS.STOP_DEVICE, object, user);
            this.broadcast(COMMANDS.DEVICE_UPDATE, {
                ...object,
                user
            });
            object = await this.repository.save(object);
            return plainToClass(OutDeviceDto, object);
        } catch (error) {
            throw error;
        }
        */
    }



    @Roles('isSuperuser')
    @Permissions('change_user')
    @HttpCode(HttpStatus.CREATED)
    @ApiResponse({
        status: HttpStatus.CREATED, type: OutDeviceDto,
        description: 'The record has been successfully created.'
    })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
    @Post()
    async create(
        @Body() dto: InDeviceDto,
        @UserEntity() user: any
    ) {
        try {
            let object = plainToClass(Device, dto);
            let newDevice: any = {
                name: 'Marantz',
                isActive: true,
                user: 1,
                fields: '[]',
                host: '192.168.1.20',
                port: '23',
                protocol: 'Tcp',
                state: DEVICE_STATE.NONE,
                flags: DEVICE_FLAGS.DEBUG,
                logging: LOGGING_FLAGS.NONE,
                blocks: JSON.stringify('{}'),
                commandSettings: DefaultCommandSettings(),
                settings: DefaultSettings()
            }

            let objectNew = { ...newDevice, ...object };
            object = await this.repository.save(objectNew);
            debug.inspect(':create', object);
            return plainToClass(OutDeviceDto, object);
        } catch (error) {
            throw error;
        }
    }

    @HttpCode(HttpStatus.OK)
    @ApiResponse({
        status: HttpStatus.OK, type: OutDeviceDto,
        description: 'The record has been successfully updated.'
    })
    /*@ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })*/
    @ApiImplicitParam({ name: 'id', type: Number })
    @Put(':id')
    async update(
        @Param('id', new ParseIntPipe()) id,
        @Body() dto: InDeviceDto,
        @UserEntity() user: any
    ) {
        try {
            let object = plainToClass(Device, dto);
            object.id = id;
            object.user = user.id;
            if (!isString(object.logging)) {
                debug.inspect('logging', object.logging);
                object.logging = JSON.stringify(object.logging, null, 2);
            }
            object = await this.repository.save(object);
            this.ws.broadcast(COMMANDS.DEVICE_UPDATE, object);
            return plainToClass(OutDeviceDto, object);
        } catch (error) {
            debug.error('error saving device ', error);
            throw error;
        }
    }
    @Roles('isSuperuser')
    @Permissions('delete_user')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiResponse({
        status: HttpStatus.NO_CONTENT,
        description: 'The record has been successfully deleted.'
    })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
    @ApiImplicitParam({ name: 'id', type: Number })
    @Delete(':id')
    async delete(
        @Param('id', new ParseIntPipe()) id
    ) {
        try {
            console.log('deleted : ', id);
            return await this.repository.delete(id);
        } catch (error) {
            throw error;
        }
    }
    @Roles('isSuperuser')
    @Permissions('load_user')
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiResponse({
        status: HttpStatus.OK, type: OutDeviceDto,
        description: '',
    })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
    @ApiImplicitParam({ name: 'id', type: Number })
    @Get(':id')
    async load(
        @Param('id', new ParseIntPipe()) id
    ) {
        try {
            let object = await this.repository.findOneOrFail(
                id,
                { relations: ['groups'] }
            );
            return plainToClass(OutDeviceDto, object);
        } catch (error) {
            throw error;
        }
    }

    @Roles('isSuperuser')
    @Permissions('load_user')
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiResponse({
        status: HttpStatus.OK, type: OutDevicesDto,
        description: ''
    })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
    @ApiImplicitQuery({ name: 'q', required: false, type: String, description: 'Text for search (default: empty)' })
    @ApiImplicitQuery({
        name: 'per_page', required: false, type: Number,
        description: 'Number of results to return per page. (default: 10)'
    })
    @ApiImplicitQuery({
        name: 'cur_page', required: false, type: Number,
        description: 'A page number within the paginated result set. (default: 1)'
    })
    @ApiImplicitQuery({
        name: 'group', required: false, type: Number,
        description: 'Group id for filter data by group. (default: empty)'
    })
    @ApiImplicitQuery({
        name: 'project', required: false, type: Number,
        description: 'Group id for filter data by group. (default: empty)'
    })
    @Get()
    async loadAll(
        @Query('cur_page', new ParseIntWithDefaultPipe(1)) curPage,
        @Query('per_page', new ParseIntWithDefaultPipe(10)) perPage,
        @Query('q') q,
        @Query('group') group,
        @Query('project', new ParseIntWithDefaultPipe(0)) project
    ) {
        try {
            let objects: [Device[], number];
            if (!group) {
                objects = await this.repository.findAndCount({
                    skip: (curPage - 1) * perPage,
                    take: perPage
                });
            } else {
                let qb = this.repository.createQueryBuilder('device');
                if (group) {
                    qb = qb.leftJoinAndSelect('user.groups', 'group')
                        .where('group.id = :group', { group: group })
                }
                qb = qb.skip((curPage - 1) * perPage)
                    .take(perPage);
                objects = await qb.getManyAndCount();
            }
            if (project) {
                objects[0] = (objects[0].filter((d) => d.project === project));
            }
            return plainToClass(OutDevicesDto, {
                devices: objects[0],
                meta: {
                    perPage: perPage,
                    totalPages: perPage > objects[1] ? 1 : (objects[1] / perPage),
                    totalResults: objects[1],
                    curPage: curPage
                }
            });
        } catch (error) {
            throw error;
        }
    }
}