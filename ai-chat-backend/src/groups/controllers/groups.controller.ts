import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus, Param, ParseIntPipe, Get, NotFoundException, Query, DefaultValuePipe } from '@nestjs/common';
import { GroupsService } from '../services/groups.service';
import { CreateGroupDto } from '../dto/create-group.dto';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from '../../chat/services/chat.service'; // Import ChatService

// Define the structure of the user object attached to the request by JwtStrategy
// This should ideally be in a shared types file or module
interface AuthenticatedUser {
  userId: number;
  username: string;
}

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('groups')
@UseGuards(AuthGuard('jwt')) // Apply JWT guard to all routes in this controller
export class GroupsController {
  constructor(
    private groupsService: GroupsService,
    private chatService: ChatService, // Inject ChatService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createGroup(
    @Body() createGroupDto: CreateGroupDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const ownerId = req.user.userId;
    return this.groupsService.createGroup(createGroupDto, ownerId);
  }

  @Post(':groupId/join')
  @HttpCode(HttpStatus.CREATED)
  async joinGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.userId;
    return this.groupsService.joinGroup(groupId, userId);
  }

  @Get()
  async findGroupsForUser(@Req() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    return this.groupsService.findGroupsForUser(userId);
  }

  @Get(':groupId')
  async findGroupById(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.userId;
    // This method already verifies membership
    return this.groupsService.findGroupWithMemberCheck(groupId, userId);
  }

  @Get(':groupId/messages')
  async getMessagesForGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.userId;
    // First, verify user is a member of the group
    await this.groupsService.findGroupWithMemberCheck(groupId, userId);
    // If the above doesn't throw, proceed to get messages
    return this.chatService.getMessagesForGroup(groupId, limit, page);
  }

  // TODO: Add endpoints for:
  // - DELETE /groups/:id/members/:userId (remove user from group - requires owner/admin or self-removal)
  // - DELETE /groups/:id (delete group - requires owner/admin)
  // - PUT /groups/:id (update group - requires owner/admin)
}
