import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiImplicitParam, ApiImplicitQuery, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { Permissions } from '../decorators/permissions.decorator';
import { Roles } from '../decorators/roles.decorator';
import { InProjectDto } from '../dto/in-project.dto';
import { OutProjectDto } from '../dto/out-project.dto';
import { Device } from '../entities/device.entity';
import { Project } from '../entities/project.entity';
import { AccessGuard } from '../guards/access.guard';
import { ParseIntWithDefaultPipe } from '../pipes/parse-int-with-default.pipe';
import { UserEntity } from './utils';
@ApiUseTags('projects')
@ApiBearerAuth()
@Controller('/api/projects')
@UseGuards(AccessGuard)
export class ProjectController {
    constructor(
        @InjectRepository(Project)
        private readonly projectsRepository: Repository<Project>,
        @InjectRepository(Device)
        private readonly deviceRepository: Repository<Device>,
    ) {

    }
    @Roles('isSuperuser')
    @Permissions('add_group')
    @HttpCode(HttpStatus.CREATED)
    @ApiResponse({
        status: HttpStatus.CREATED, type: OutProjectDto,
        description: 'The record has been successfully created.'
    })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
    @Post()
    async create(
        @Body() dto: InProjectDto
    ) {
        try {
            let object = plainToClass(Project, dto);
            object = await this.projectsRepository.save(object)
            return plainToClass(OutProjectDto, object);
        } catch (error) {
            throw error;
        }
    }
    @Roles('isSuperuser')
    @Permissions('change_group')
    @HttpCode(HttpStatus.OK)
    @ApiResponse({
        status: HttpStatus.OK, type: OutProjectDto,
        description: 'The record has been successfully updated.'
    })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
    @ApiImplicitParam({ name: 'id', type: Number })
    @Put(':id')
    async update(
        @Param('id', new ParseIntPipe()) id,
        @Body() dto: InProjectDto
    ) {
        try {
            let object = plainToClass(Project, dto);
            object.id = id;
            object = await this.projectsRepository.save(object);
            return plainToClass(OutProjectDto, object);
        } catch (error) {
            throw error;
        }
    }
    @Roles('isSuperuser')
    @Permissions('delete_group')
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
            return await this.projectsRepository.delete(id);
        } catch (error) {
            throw error;
        }
    }
    @Roles('isSuperuser')
    @Permissions('read_group')
    @HttpCode(HttpStatus.OK)
    @ApiResponse({
        status: HttpStatus.OK, type: OutProjectDto,
        description: ''
    })
    /*@ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })*/
    @ApiImplicitParam({ name: 'id', type: Number })
    @Get(':id')
    async load(
        @Param('id', new ParseIntPipe()) id
    ) {
        try {
            let object = await this.projectsRepository.findOneOrFail(id);
            return plainToClass(OutProjectDto, object);
        } catch (error) {
            throw error;
        }
    }

    /*@Roles('isSuperuser')*/
    @Permissions('read_group')
    @HttpCode(HttpStatus.OK)
    @ApiResponse({
        status: HttpStatus.OK, type: OutProjectDto,
        description: ''
    })
    /*@ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })*/
    @ApiImplicitQuery({ name: 'q', required: false, type: String, description: 'Text for search (default: empty)' })
    @ApiImplicitQuery({
        name: 'per_page', required: false, type: Number,
        description: 'Number of results to return per page. (default: 10)'
    })
    @ApiImplicitQuery({
        name: 'cur_page', required: false, type: Number,
        description: 'A page number within the paginated result set. (default: 1)'
    })
    @Get()
    async loadAll(
        @Query('cur_page', new ParseIntWithDefaultPipe(1)) curPage,
        @Query('per_page', new ParseIntWithDefaultPipe(10)) perPage,
        @Query('q') q,
        @UserEntity() user: any
    ) {
        try {
            const objects = await this.projectsRepository.findAndCount({
                skip: (curPage - 1) * perPage,
                take: perPage
            });
            objects[0] = objects[0].filter((p) => p.user === user.id);

            const devices = await this.deviceRepository.find({
                user: user.id
            });

            objects[0].forEach((p) => {
                p['devices'] = devices.filter((d) => d.project === p.id);
            });
            
            // console.log('all', user, objects[0]);
            return plainToClass(OutProjectDto, {
                groups: objects[0],
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