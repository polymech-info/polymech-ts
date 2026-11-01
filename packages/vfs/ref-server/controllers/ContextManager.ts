import { User } from '../entities/user.entity';
import { Context } from '../manager/Context'
import * as lodash from 'lodash';
import {
    Component
} from '@nestjs/common';
import { inspect, error } from '../log';
import { EventsGateway } from './events.gateway';

export class ContextManager {
    contexts: Context[] = [];
    context(user: User, gateway: EventsGateway): Context {
        let context: Context = null;
        this.contexts.forEach((c) => {
            if (c.user.id = user.id) {
                context = c;
            }
        })
        if (!context) {
            context = new Context();
            this.contexts.push(context);
            context.init(user, gateway);
            context.run();
        }
        return context;
    }
}