import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, MaxLength } from 'class-validator';

import { GroupDto } from './group.dto';
import { DeviceDto } from './device.dto';

export class InDeviceDto extends DeviceDto {
    
}