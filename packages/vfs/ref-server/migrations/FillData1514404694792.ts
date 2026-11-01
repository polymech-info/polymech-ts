import { MigrationInterface, QueryRunner } from 'typeorm';

import { ContentType } from '../entities/content-type.entity';
import { Group } from '../entities/group.entity';
import { plainToClass } from 'class-transformer';
import { Permission } from '../entities/permission.entity';
import { User } from '../entities/user.entity';
import { Device } from '../entities/device.entity';
import { Project } from '../entities/project.entity';
import { File } from '../entities/file.entity';
import { COMMANDS } from '../shared';
import { DEVICE_STATE, DEVICE_FLAGS, LOGGING_FLAGS, DefaultCommandSettings, DefaultSettings } from '../types';

const marantz = require('./marantz.json');

export class FillData1514404694792 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        const ctPermission = await queryRunner.manager.getRepository<ContentType>(ContentType).save(
            plainToClass(ContentType, { name: 'permission', title: 'Permission' })
        );
        const ctGroup = await queryRunner.manager.getRepository<ContentType>(ContentType).save(
            plainToClass(ContentType, { name: 'group', title: 'Group' })
        );
        const ctContentTtype = await queryRunner.manager.getRepository<ContentType>(ContentType).save(
            plainToClass(ContentType, { name: 'content-type', title: 'Content type' })
        );
        const ctUser = await queryRunner.manager.getRepository<ContentType>(ContentType).save(
            plainToClass(ContentType, { name: 'user', title: 'User' })
        );

        const ctDevice = await queryRunner.manager.getRepository<ContentType>(ContentType).save(
            plainToClass(ContentType, { name: 'device', title: 'Device' })
        );

        const pPermissions = await queryRunner.manager.getRepository<Permission>(Permission).save(
            plainToClass(Permission,
                [{
                    title: 'Can add permission',
                    name: 'add_permission',
                    contentType: ctPermission
                },
                {
                    title: 'Can change permission',
                    name: 'change_permission',
                    contentType: ctPermission
                },
                {
                    title: 'Can delete permission',
                    name: 'delete_permission',
                    contentType: ctPermission
                },
                {
                    title: 'Can add group',
                    name: 'add_group',
                    contentType: ctGroup
                },
                {
                    title: 'Can change group',
                    name: 'change_group',
                    contentType: ctGroup
                },
                {
                    title: 'Can delete group',
                    name: 'delete_group',
                    contentType: ctGroup
                },
                {
                    title: 'Can add content type',
                    name: 'add_content-type',
                    contentType: ctContentTtype
                },
                {
                    title: 'Can change content type',
                    name: 'change_content-type',
                    contentType: ctContentTtype
                },
                {
                    title: 'Can delete content type',
                    name: 'delete_content-type',
                    contentType: ctContentTtype
                },
                {
                    title: 'Can add user',
                    name: 'add_user',
                    contentType: ctUser
                },
                {
                    title: 'Can change user',
                    name: 'change_user',
                    contentType: ctUser
                },
                {
                    title: 'Can delete user',
                    name: 'delete_user',
                    contentType: ctUser
                },
                {
                    title: 'Can read user',
                    name: 'read_user',
                    contentType: ctUser
                },
                {
                    title: 'Can read group',
                    name: 'read_group',
                    contentType: ctGroup
                },
                {
                    title: 'Can read permission',
                    name: 'read_permission',
                    contentType: ctPermission
                },
                {
                    title: 'Can read content type',
                    name: 'read_content-type',
                    contentType: ctContentTtype
                },
                {
                    title: 'Can change profile',
                    name: 'change_profile',
                    contentType: ctUser
                },
                {
                    title: 'Can start device',
                    name: COMMANDS.START_DEVICE,
                    contentType: ctDevice
                }
                ]
            )
        );
        const gUser = await queryRunner.manager.getRepository<Group>(Group).save(
            plainToClass(Group,
                {
                    name: 'user', title: 'User',
                    permissions: pPermissions.filter(item =>
                        item.name === 'change_profile'
                    )
                }
            )
        );
        const gAdmin = await queryRunner.manager.getRepository<Group>(Group).save(
            plainToClass(Group,
                {
                    name: 'admin', title: 'Admin',
                    permissions: pPermissions
                }
            )
        );
        const tempUser = new User();
        const uUsers = await queryRunner.manager.getRepository<User>(User).save(
            plainToClass(User,
                [{
                    username: 'admin',
                    email: 'admin@admin.com',
                    password: tempUser.makePassword('12345678'),
                    firstName: 'AdminFirstName',
                    lastName: 'AdminLastName',
                    isSuperuser: true,
                    isStaff: false,
                    isActive: true,
                    groups: [gAdmin]
                },
                {
                    username: 'user1',
                    email: 'user1@user1.com',
                    password: tempUser.makePassword('12345678'),
                    firstName: 'User1FirstName',
                    lastName: 'User1LastName',
                    isSuperuser: false,
                    isStaff: false,
                    isActive: true,
                    groups: [gUser]
                },
                {
                    username: 'user2',
                    email: 'user2@user2.com',
                    password: tempUser.makePassword('12345678'),
                    firstName: 'User2FirstName',
                    lastName: 'User2LastName',
                    isSuperuser: false,
                    isStaff: false,
                    isActive: true,
                    groups: [gUser]
                }]
            )
        );

        const uDevices = await queryRunner.manager.getRepository<Device>(Device).save(
            plainToClass(Device,
                [{
                    name: 'Marantz',
                    isActive: true,
                    user: 1,
                    fields: '[]',
                    host: '192.168.1.20',
                    port: '23',
                    protocol: 'Tcp',
                    state: DEVICE_STATE.NONE,
                    flags: DEVICE_FLAGS.DEBUG,
                    logging: "{\n  \"Device Connected\": 47,\n  \"Response\": 35,\n  \"Send Command\": 51,\n  \"Device Disonnected\": 39,\n  \"Device Error\": 1\n}",
                    blocks: JSON.stringify(marantz),
                    commandSettings: DefaultCommandSettings(),
                    settings: DefaultSettings(),
                    project: 1
                }]
            )
        );

        const uProject = await queryRunner.manager.getRepository<Project>(Project).save(
            plainToClass(Project,
                [{
                    name: 'Project Title',
                    user: 1
                },
                {
                    name: 'Project Title 2',
                    user: 2
                }
                ]
            )
        );

        const uFile = await queryRunner.manager.getRepository<File>(File).save(
            plainToClass(Project,
                [{
                    user: 1,
                    content: 'test',
                    path: '/myscene.html',
                    type: 1,
                    date: new Date()
                }
                ]
            )
        );
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
    }

}
