import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FileDto } from './file.dto';

export class OutFileDto {
    @Type(() => FileDto)
    @ApiModelProperty({ type: FileDto })
    file: FileDto;
}