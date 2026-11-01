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
export class File {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    path: string;

    @Column()
    user: number;

    @Column({ type: 'blob' })
    content: string;

    @Column({ type: 'integer' })
    type: string;

    @Column({ type: Date, nullable: true })
    date: Date;

    @BeforeUpdate()
    doBeforeUpdate() {
        const errors = validateSync(this, { validationError: { target: false } });
        if (errors.length > 0) {
            throw new CustomValidationError(errors)
        }
    }

    public toString() {
        return `${this.path}`
    }
}