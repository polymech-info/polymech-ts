import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from './core.module';
import { entities } from './entities/index';
import { ContextManager } from './controllers/ContextManager';
import { AccessGuard } from './guards/access.guard';

const maxListenersExceededWarning = require('max-listeners-exceeded-warning'); 
maxListenersExceededWarning();
@Module({
  imports:[ContextManager],
  modules: [
    TypeOrmModule.forRoot(),
    CoreModule
  ],
  controllers: []
})
export class AppModule { }
