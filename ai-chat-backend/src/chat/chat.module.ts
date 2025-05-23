import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { ChatGateway } from './gateways/chat.gateway';
import { ChatService } from './services/chat.service';
import { AuthModule } from '../auth/auth.module'; // For JWT strategy or token verification
import { UsersModule } from '../users/users.module'; // To make UsersService available
import { GroupsModule } from '../groups/groups.module'; // To make GroupsService available

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    AuthModule, // Provides JWT strategy and potentially ConfigService if needed by Gateway for auth
    UsersModule, // For UsersService injection
    GroupsModule, // For GroupsService injection
  ],
  providers: [ChatGateway, ChatService],
  exports: [ChatService, ChatGateway], // Export if other modules need them
})
export class ChatModule {}
