import { Exclude, Type } from 'class-transformer';
import { MaxLength } from 'class-validator';

import { ApiModelProperty, ApiModelPropertyOptional,  } from '@nestjs/swagger';
import { LOGGING_FLAGS, DEVICE_STATE, DEVICE_FLAGS, RETRY_SETTINGS, DefaultRetry } from '../types';
export class DeviceDto {
    
    @ApiModelProperty({ type: Number, required: false })
    id: number;
    
    @ApiModelProperty({ type: Boolean, required: false })
    isActive: boolean;
    
    @ApiModelProperty({ type: String, default:'My Device' })
    name: string;

    @ApiModelProperty({ type: String,required:false, default:'[]' })
    fields: string;

    @ApiModelProperty({ type: Number, required: false })
    user: number;

    @ApiModelProperty({ type: Number, required: false })
    project: number;

    @ApiModelProperty({ type: Number, required: false })
    flags: number = DEVICE_FLAGS.NONE;

    @ApiModelProperty({ type: String, required: false })
    state: number = DEVICE_FLAGS.NONE;

    @ApiModelProperty({ type: String, required: false })
    host: string;

    @ApiModelProperty({ type: String, required: false })
    port: string;

    @ApiModelProperty({ type: String, required: false })
    protocol: string;

    @ApiModelProperty({ type: String, required: false })
    logging: string;

    @ApiModelProperty({ type: String, required: false })
    retry: string;

    @ApiModelProperty({ type: String, required: false })
    blocks: string;

    @ApiModelProperty({ type: String, required: false })
    commandSettings: string;
    
    @ApiModelProperty({ type: String, required: false })
    settings: string;
}