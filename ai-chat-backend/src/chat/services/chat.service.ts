import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { User } from '../../users/entities/user.entity';
import { Group } from '../../groups/entities/group.entity';
import { UsersService } from '../../users/services/users.service';
import { GroupsService } from '../../groups/services/groups.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private usersService: UsersService,
    private groupsService: GroupsService,
  ) {}

  async createMessage(content: string, userId: number, groupId: number): Promise<Message> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    // Verify group exists and user is a member
    // findGroupWithMemberCheck will throw NotFoundException or ForbiddenException if checks fail
    const group = await this.groupsService.findGroupWithMemberCheck(groupId, userId);
    if (!group) {
      // This case should ideally be covered by findGroupWithMemberCheck,
      // but as a fallback or if the method signature changes:
      throw new NotFoundException(`Group with ID ${groupId} not found or user not a member.`);
    }

    const newMessage = this.messagesRepository.create({
      content,
      user, // Assign the full user entity
      group, // Assign the full group entity
    });

    try {
      const savedMessage = await this.messagesRepository.save(newMessage);

      // Prepare the message for return, ensuring user data is sanitized
      // The 'user' relation is already loaded because we assigned the entity.
      // We need to make sure passwordHash is not part of the returned user object.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...sanitizedUser } = user;
      savedMessage.user = sanitizedUser as User;

      return savedMessage;
    } catch (error) {
      console.error('Error creating message:', error);
      throw new InternalServerErrorException('Failed to create message.');
    }
  }

  async getMessagesForGroup(
    groupId: number,
    limit: number = 50,
    page: number = 1,
  ): Promise<{ messages: Message[]; total: number }> {
    // Verify group exists. We don't strictly need member check here,
    // as that's an authorization concern handled by the controller before calling this.
    // However, the controller *is* calling findGroupWithMemberCheck, so this is somewhat redundant
    // but good for service-layer integrity if the method is called from elsewhere.
    const group = await this.groupsService.findGroupById(groupId);
    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found.`);
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await this.messagesRepository.findAndCount({
      where: { group: { id: groupId } },
      relations: ['user'], // Load the user (sender) relation
      order: { createdAt: 'DESC' }, // Latest messages first
      take: limit,
      skip: skip,
    });

    // Sanitize user data in messages
    const sanitizedMessages = messages.map((message) => {
      if (message.user) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...sanitizedUser } = message.user;
        message.user = sanitizedUser as User;
      }
      return message;
    });

    return { messages: sanitizedMessages, total };
  }
}
