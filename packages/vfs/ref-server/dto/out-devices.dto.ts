import { Type } from 'class-transformer';

import { MetaDto } from './meta.dto';
import { DeviceDto } from './device.dto';
import { ApiModelProperty } from '@nestjs/swagger';

export class OutDevicesDto {
    @Type(() => DeviceDto)
    @ApiModelProperty({ type: DeviceDto, isArray: true })
    devices: DeviceDto[];
    @Type(() => MetaDto)
    @ApiModelProperty({ type: MetaDto })
    meta: MetaDto;
}