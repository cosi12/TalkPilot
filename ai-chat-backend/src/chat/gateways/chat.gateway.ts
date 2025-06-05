import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  WsException, // For throwing WebSocket errors
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException, UsePipes, ValidationPipe } from '@nestjs/common'; // Added ValidationPipe
import { ChatService } from '../services/chat.service';
import { UsersService } from '../../users/services/users.service';
import { GroupsService } from '../../groups/services/groups.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config'; // To get JWT_SECRET

// DTO for sendMessage payload validation
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class SendMessageDto {
  @IsNumber()
  groupId: number;

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class RoomDto {
  @IsNumber()
  groupId: number;
}


// Define the structure of the user object attached to the socket by our logic
interface AuthenticatedSocketUser {
  userId: number;
  username: string;
}

interface AuthenticatedSocket extends Socket {
  user?: AuthenticatedSocketUser; // Added '?' as it's not present until auth completes
}

@WebSocketGateway({
  namespace: '/chat', // Optional: if you want to namespace your chat endpoint
  cors: {
    origin: '*', // For development, allow all origins. For production, restrict this.
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedClients: Map<number, AuthenticatedSocket> = new Map();

  constructor(
    private chatService: ChatService,
    private usersService: UsersService, // Keep if direct user lookups needed beyond auth
    private groupsService: GroupsService,
    private jwtService: JwtService,
    private configService: ConfigService, // For JWT secret
  ) {}

  afterInit(server: Server) {
    this.logger.log('ChatGateway Initialized');
  }

  async handleConnection(client: AuthenticatedSocket, ...args: any[]) {
    this.logger.log(`Client attempting to connect: ${client.id}`);
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        this.logger.warn(`Connection attempt by ${client.id} without token.`);
        throw new UnauthorizedException('No token provided');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Attach user info to the socket object
      client.user = { userId: payload.sub, username: payload.username };

      this.connectedClients.set(client.user.userId, client);
      this.logger.log(`Client connected: ${client.id}, UserID: ${client.user.userId}, Username: ${client.user.username}`);
    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}: ${error.message}`);
      client.emit('auth_error', 'Authentication failed: ' + error.message); // Send specific error to client
      client.disconnect(true); // Force disconnect
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      this.connectedClients.delete(client.user.userId);
      this.logger.log(`Client disconnected: ${client.id}, UserID: ${client.user.userId}`);
    } else {
      this.logger.log(`Client disconnected: ${client.id} (was not fully authenticated)`);
    }
  }

  @UsePipes(new ValidationPipe()) // Apply validation to DTOs
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: RoomDto, // Use DTO for payload
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<{ status: string; message?: string }> {
    if (!client.user) {
      throw new WsException('User not authenticated.');
    }
    const { groupId } = data;
    const userId = client.user.userId;
    this.logger.log(`UserID: ${userId} attempting to join room for GroupID: ${groupId}`);

    try {
      await this.groupsService.findGroupWithMemberCheck(groupId, userId);
      const roomName = `group_${groupId}`;
      client.join(roomName);
      this.logger.log(`UserID: ${userId} joined room: ${roomName}`);
      return { status: 'success', message: `Joined room for group ${groupId}` };
    } catch (error) {
      this.logger.error(`Failed for UserID: ${userId} to join room for GroupID: ${groupId} - ${error.message}`);
      // WsException can take an object, which is good for structured errors
      throw new WsException({ status: 'error', message: error.message });
    }
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() data: RoomDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<{ status: string; message?: string }> {
    if (!client.user) {
      throw new WsException('User not authenticated.');
    }
    const { groupId } = data;
    const roomName = `group_${groupId}`;
    client.leave(roomName);
    this.logger.log(`UserID: ${client.user.userId} left room: ${roomName}`);
    return { status: 'success', message: `Left room for group ${groupId}` };
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() payload: SendMessageDto, // Use DTO for payload
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> { // Return type changed to void as we emit, not return via ack for this
    if (!client.user) {
      throw new WsException('User not authenticated.');
    }
    const userId = client.user.userId;
    const { groupId, content } = payload;
    this.logger.log(`UserID: ${userId} sending message to GroupID: ${groupId}: "${content}"`);

    try {
      // chatService.createMessage handles member check via groupsService.findGroupWithMemberCheck
      const message = await this.chatService.createMessage(content, userId, groupId);

      const roomName = `group_${groupId}`;
      this.server.to(roomName).emit('newMessage', message); // Emit to all clients in the room
      this.logger.log(`Message broadcasted to room: ${roomName}`);
      // No explicit ack needed here unless specified by client-side logic expectations
    } catch (error) {
      this.logger.error(`Failed for UserID: ${userId} to send message to GroupID: ${groupId} - ${error.message}`);
      // Optionally emit an error event back to the sender if the message fails to process
      client.emit('sendMessageError', { status: 'error', message: error.message, groupId: groupId });
      // Or use WsException if an acknowledgement is expected for errors by the client
      // throw new WsException({ status: 'error', message: error.message });
    }
  }
}
