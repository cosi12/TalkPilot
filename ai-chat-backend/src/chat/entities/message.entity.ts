import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Group } from '../../groups/entities/group.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: false })
  content: string;

  @ManyToOne(() => User, { nullable: false }) // Eager loading can be added here if needed
  @JoinColumn({ name: 'user_id' })
  user: User; // Sender of the message

  @ManyToOne(() => Group, (group) => group.messages, { nullable: false })
  @JoinColumn({ name: 'group_id' })
  group: Group; // Group the message belongs to

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
