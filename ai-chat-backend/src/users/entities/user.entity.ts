import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true, nullable: false })
  username: string; // 用于登录

  @Column({ type: 'varchar', nullable: false, name: 'password_hash' })
  passwordHash: string; // 存储加密后的密码

  @Column({ type: 'varchar', nullable: true })
  nickname: string; // 用户昵称，可为空

  @Column({ type: 'varchar', nullable: true, name: 'avatar_url' })
  avatarUrl: string; // 用户头像链接，可为空

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
