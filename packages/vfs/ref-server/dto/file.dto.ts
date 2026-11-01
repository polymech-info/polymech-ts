import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
export class FileDto {
    @ApiModelProperty({ type: String, default: 'My Project' })
    path: string;
}