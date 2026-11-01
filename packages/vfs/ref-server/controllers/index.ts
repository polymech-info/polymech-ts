import { AccountController } from './account.controller';
import { ContentTypesController } from './content-types.controller';
import { GroupsController } from './groups.controller';
import { PermissionsController } from './permissions.controller';
import { UsersController } from './users.controller';
import { DevicesController } from './devices.controller';
import { ProjectController } from './projects.controller';
import { VFSController } from './vfs.controller';
export const controllers = [
    AccountController,
    ContentTypesController,
    PermissionsController,
    UsersController,
    GroupsController,
    DevicesController,
    ProjectController,
    VFSController
]