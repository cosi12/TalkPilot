import { Module, forwardRef } from '@nestjs/common'; // Import forwardRef
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { GroupsService } from './services/groups.service';
import { GroupsController } from './controllers/groups.controller';
import { UsersModule } from '../users/users.module';
import { ChatModule } from '../chat/chat.module'; // Import ChatModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, GroupMember]),
    UsersModule,
    forwardRef(() => ChatModule), // Use forwardRef to handle circular dependency with ChatModule
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
