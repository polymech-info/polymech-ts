import { IsString, IsEmail, IsNotEmpty, IsOptional, MaxLength, validateSync, IsNumber } from 'class-validator';
import {
    BeforeInsert,
    BeforeUpdate,
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    ColumnType,
    AfterLoad
} from 'typeorm';

import { CustomValidationError } from '../exceptions/custom-validation.error';
import {
    LOGGING_FLAGS,
    DEVICE_STATE,
    DEVICE_FLAGS,
    RETRY_SETTINGS,
    DefaultRetry,
    DefaultBlocks,
    DefaultSettings,
    DefaultCommandSettings
} from '../shared/types';
import { ValueTransformer } from 'typeorm/decorator/options/ValueTransformer';
import { isString } from '@xblox/core/primitives';
import { debug } from '../log';

export const JSON_TRANSFORMER: ValueTransformer = {
    to(value: any): string {
        if (!isString(value)) {
            return JSON.stringify(value, null, 2);
        } else {
            return value;
        }
    },
    from(value: string): any {
        if (isString(value)) {
            return JSON.parse(value);
        }
        return value;
    }
}

@Entity()
export class Device {

    public scope: any;

    @IsOptional()
    @PrimaryGeneratedColumn()
    id: number;


    @Column({ length: 150 })
    @IsNotEmpty()
    @MaxLength(150)
    name: string;

    @Column()
    @IsNotEmpty()
    host: string;

    @Column()
    @IsNotEmpty()
    port: string;

    @Column()
    @IsNotEmpty()
    protocol: string;

    @Column()
    @IsString()
    @IsOptional()
    state: string = DEVICE_STATE.NONE;

    @Column()
    @IsNumber()
    @IsOptional()
    flags: number = DEVICE_FLAGS.NONE;

    @Column()
    @IsString()
    @IsOptional()
    logging: string = "{\n  \"Device Connected\": 47,\n  \"Response\": 35,\n  \"Send Command\": 51,\n  \"Device Disonnected\": 39,\n  \"Device Error\": 1\n}";

    @Column({ name: 'fields' })
    @IsString()
    fields: string;


    @Column({ name: 'is_active' })
    @IsNotEmpty()
    isActive: boolean;

    @Column({
        transformer: JSON_TRANSFORMER
    })
    @IsOptional()
    retry: string = JSON.stringify(DefaultRetry());

    @Column({ name: 'user' })
    @IsNotEmpty()
    user: number;

    @Column({ name: 'project' })
    @IsNotEmpty()
    project: number;

    @Column({
        transformer: JSON_TRANSFORMER
    })
    @IsOptional()
    blocks: string = JSON.stringify(DefaultBlocks());

    @Column({
        transformer: JSON_TRANSFORMER
    })
    @IsOptional()
    settings: string = JSON.stringify(DefaultSettings());

    @Column({
        transformer: JSON_TRANSFORMER
    })
    @IsOptional()
    commandSettings: string = JSON.stringify(DefaultCommandSettings());

    @BeforeUpdate()
    doBeforeUpdate() {
        const errors = validateSync(this, { validationError: { target: false } });
        if (errors.length > 0) {
            console.error('validation error', errors);
            throw new CustomValidationError(errors)
        }
    }

    @AfterLoad()
    doAfter() {
        this.retry = JSON_TRANSFORMER.from(this.retry);
        this.blocks = JSON_TRANSFORMER.from(this.blocks);
        this.settings = JSON_TRANSFORMER.from(this.settings);
        this.commandSettings = JSON_TRANSFORMER.from(this.commandSettings);
        this.logging = JSON_TRANSFORMER.from(this.logging);
    }

    public toString() {
        return `${this.protocol}://${this.host}:${this.port}`
    }
}