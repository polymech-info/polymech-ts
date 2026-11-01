import { Module } from '@nestjs/common';
import { ContextManager } from './controllers/ContextManager';
import { controllers } from './controllers/index';
import { services } from './services/index';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from './entities/index';
import { EventsGateway } from './controllers/events.gateway';
@Module({
  imports: [
    TypeOrmModule.forFeature([...entities])
  ],
  controllers: [
    ...controllers
  ],
  components: [
    ...services,
    EventsGateway
  ],
})
export class CoreModule {
}
