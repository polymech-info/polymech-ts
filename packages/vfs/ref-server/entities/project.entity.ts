import { isString } from '@xblox/core/primitives';
import { IsNotEmpty, IsOptional, MaxLength, validateSync } from 'class-validator';
import { AfterLoad, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn } from 'typeorm';
import { ValueTransformer } from 'typeorm/decorator/options/ValueTransformer';
import { CustomValidationError } from '../exceptions/custom-validation.error';

export const JSON_TRANSFORMER: ValueTransformer = {
    to(value: any): string {
        return JSON.stringify(value, null, 2);
    },
    from(value: string): any {
        if (isString(value)) {
            return JSON.parse(value);
        }
        return value;
    }
}

@Entity()
export class Project {

    @CreateDateColumn({ name:'created_date', nullable: true })
    created: Date;

    @CreateDateColumn({ name: 'last_edited', nullable: true })
    lastEdited: Date;

    @IsOptional()
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    @IsNotEmpty()
    @IsOptional()
    user: number;

    @Column({ length: 150 })
    @IsNotEmpty()
    @MaxLength(150)
    name: string;
    @Column({
        transformer: JSON_TRANSFORMER
    })
    
    @IsOptional()
    settings: string = JSON.stringify({});

    @BeforeUpdate()
    doBeforeUpdate() {
        const errors = validateSync(this, { validationError: { target: false } });
        if (errors.length > 0) {
            throw new CustomValidationError(errors)
        }
    }

    @AfterLoad()
    doAfter() {
        this.settings = JSON_TRANSFORMER.from(this.settings);
    }

    public toString() {
        return `${this.name}`
    }
}