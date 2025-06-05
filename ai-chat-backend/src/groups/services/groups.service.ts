import { Injectable, NotFoundException, InternalServerErrorException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Group } from '../entities/group.entity';
import { GroupMember } from '../entities/group-member.entity';
import { User } from '../../users/entities/user.entity'; // User is implicitly imported via UsersService, but explicit for clarity
import { UsersService } from '../../users/services/users.service';
import { CreateGroupDto } from '../dto/create-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupsRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private groupMembersRepository: Repository<GroupMember>,
    private usersService: UsersService, // To fetch User entities
  ) {}

  async createGroup(createGroupDto: CreateGroupDto, ownerId: number): Promise<Group> {
    const owner = await this.usersService.findOneById(ownerId);
    if (!owner) {
      throw new NotFoundException(`User with ID ${ownerId} not found (to be group owner).`);
    }

    const newGroup = this.groupsRepository.create({
      name: createGroupDto.name,
      owner: owner,
    });

    try {
      const savedGroup = await this.groupsRepository.save(newGroup);

      const ownerMember = this.groupMembersRepository.create({
        group: savedGroup,
        user: owner,
      });
      await this.groupMembersRepository.save(ownerMember);

      // Return the group with its owner relation populated.
      // To include members list, it would typically be fetched separately or ensured via relations in findOne.
      return savedGroup;
    } catch (error) {
      console.error('Error creating group or adding owner as member:', error);
      throw new InternalServerErrorException('Failed to create group.');
    }
  }

  async findGroupById(groupId: number, relations: string[] = []): Promise<Group | undefined> {
    return this.groupsRepository.findOne({
      where: { id: groupId },
      relations,
    });
  }

  async joinGroup(groupId: number, userId: number): Promise<GroupMember> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    const group = await this.findGroupById(groupId);
    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found.`);
    }

    const existingMember = await this.groupMembersRepository.findOne({
      where: { group: { id: groupId }, user: { id: userId } },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this group.');
    }

    const newMember = this.groupMembersRepository.create({
      group,
      user,
    });

    try {
      return await this.groupMembersRepository.save(newMember);
    } catch (error) {
      console.error('Error adding user to group:', error);
      throw new InternalServerErrorException('Failed to join group.');
    }
  }

  async findGroupsForUser(userId: number): Promise<Group[]> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      // Or return empty array depending on desired behavior
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    const groupMemberships = await this.groupMembersRepository.find({
      where: { user: { id: userId } },
      relations: ['group', 'group.owner'], // Load the group and its owner
    });

    return groupMemberships.map(gm => {
      // Ensure owner's passwordHash is not exposed if it was loaded
      if (gm.group && gm.group.owner) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...ownerDetails } = gm.group.owner;
        gm.group.owner = ownerDetails as User;
      }
      return gm.group;
    });
  }

  async findGroupWithMemberCheck(groupId: number, userId: number): Promise<Group | null> {
    const group = await this.groupsRepository.findOne({
      where: { id: groupId },
      relations: ['owner', 'members', 'members.user'], // Load owner and members with their user details
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found.`);
    }

    const isMember = group.members.some(member => member.user.id === userId);

    if (!isMember) {
      // Depending on policy, either throw ForbiddenException or return null
      // For this case, let's throw, as accessing a group you're not part of is usually forbidden
      throw new ForbiddenException('You are not a member of this group.');
    }

    // Sanitize owner and member data before returning
    if (group.owner) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...ownerDetails } = group.owner;
        group.owner = ownerDetails as User;
    }
    group.members = group.members.map(member => {
        if (member.user) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { passwordHash, ...userDetails } = member.user;
            member.user = userDetails as User;
        }
        return member;
    });

    return group;
  }

  // TODO: Add methods for:
  // - Removing a user from a group
  // - Deleting a group (and handling members)
  // - Updating group details
}
