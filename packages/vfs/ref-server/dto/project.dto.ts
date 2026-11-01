import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
export class ProjectDto {
    
    @ApiModelProperty({ type: Number, required: false })
    id: number;

    @ApiModelProperty({ type: Number, required: false })
    user: number;
    
    @ApiModelProperty({ type: String, default:'My Project' })
    name: string;

    @ApiModelProperty({ type: String, required: false, default:'{}' })
    settings: string;

    @ApiModelPropertyOptional({ type: String })
    created: Date;

    @ApiModelPropertyOptional({ type: String })
    lastEdited: Date;
}