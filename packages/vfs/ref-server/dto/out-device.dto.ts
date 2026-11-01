import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DeviceDto } from './device.dto';

export class OutDeviceDto {
    @Type(() => DeviceDto)
    @ApiModelProperty({ type: DeviceDto })
    device: DeviceDto;
}