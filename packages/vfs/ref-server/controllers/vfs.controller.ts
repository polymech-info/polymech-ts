import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, Query, UseGuards, createRouteParamDecorator, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiImplicitParam, ApiImplicitQuery, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { Permissions } from '../decorators/permissions.decorator';
import { Roles } from '../decorators/roles.decorator';
import { InFileDto } from '../dto/in-file.dto';
import { OutFileDto } from '../dto/out-file.dto';
import { File } from '../entities/file.entity';
import { Project } from '../entities/project.entity';
import { AccessGuard } from '../guards/access.guard';
import { ParseIntWithDefaultPipe } from '../pipes/parse-int-with-default.pipe';
import { UserEntity } from './utils';
import { inspect } from '../log';

import { config } from '../config';
import { User } from '../entities/user.entity';


export const PathEntity = createRouteParamDecorator((data, req: any): string => {
    return req._parsedUrl.path;
});

@ApiUseTags('vfs')
@ApiBearerAuth()
@Controller('/api/vfs')
@UseGuards(AccessGuard)
export class VFSController {
    constructor(
        @InjectRepository(File)
        private readonly vfsepository: Repository<File>
    ) {

    }
    @Roles('isSuperuser')
    @Permissions('add_group')
    @HttpCode(HttpStatus.CREATED)
    @ApiResponse({
        status: HttpStatus.CREATED, type: OutFileDto,
        description: 'The record has been successfully created.'
    })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
    @Post()
    async create(
        @Body() dto: InFileDto
    ) {
        try {
            let object = plainToClass(Project, dto);
            object = await this.vfsepository.save(object)
            return plainToClass(OutFileDto, object);
        } catch (error) {
            throw error;
        }
    }
    @Roles('isSuperuser')
    @Permissions('change_group')
    @HttpCode(HttpStatus.OK)
    @ApiResponse({
        status: HttpStatus.OK, type: OutFileDto,
        description: 'The record has been successfully updated.'
    })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
    @ApiImplicitParam({ name: 'id', type: Number })
    @Put(':id')
    async update(
        @Param('id', new ParseIntPipe()) id,
        @Body() dto: InFileDto
    ) {
        try {
            let object = plainToClass(Project, dto);
            object.id = id;
            object = await this.vfsepository.save(object);
            return plainToClass(OutFileDto, object);
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
            return await this.vfsepository.delete(id);
        } catch (error) {
            throw error;
        }
    }

    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiResponse({
        status: HttpStatus.OK, type: OutFileDto,
        description: ''
    })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' })
    @Get('/*/')
    async load(
        @UserEntity() user: any,
        @PathEntity() path: any        
    ) {        
        const objects = await this.vfsepository.findAndCount({
            path: path
        });
        
        // objects[0] = objects[0].filter((f) => f.path === path);        
        // inspect('o2', objects[0]);
        //objects[0] = objects[0].filter((f) => f.path === path && f.user === user.id);
        //inspect('o2', objects);
        /*
        let object = await this.vfsepository.findOneOrFail(1);
        */
        // console.log('o', objects[0]);
        if(objects[0][0]){
            return (objects[0][0] as any).content;
        }
        return 'asdf ' + path;
    }
    /*
    console.log('1');
    try {
        let object = await this.vfsepository.findOneOrFail(id);
        return plainToClass(OutFileDto, object);
    } catch (error) {
        throw error;
    }-9
    
}




/*@Roles('isSuperuser')*/
    @Permissions('read_group')
    @HttpCode(HttpStatus.OK)
    @ApiResponse({
        status: HttpStatus.OK, type: OutFileDto,
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
            /*
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
            return plainToClass(OutFileDto, {
                groups: objects[0],
                meta: {
                    perPage: perPage,
                    totalPages: perPage > objects[1] ? 1 : (objects[1] / perPage),
                    totalResults: objects[1],
                    curPage: curPage
                }
            });
            */
        } catch (error) {
            throw error;
        }
    }
}