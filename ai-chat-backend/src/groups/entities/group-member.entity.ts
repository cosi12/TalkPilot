import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Group } from './group.entity';

@Entity('group_members')
@Unique(['user', 'group']) // Ensures a user can only join a group once
export class GroupMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: false }) // Eager loading can be added here if needed
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Group, (group) => group.members, { nullable: false })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;
}
