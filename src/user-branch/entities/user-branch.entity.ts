import {
    Entity,
    Column,
    ManyToOne,
    PrimaryColumn,
  } from 'typeorm';
  import { Field, ObjectType } from '@nestjs/graphql';
  import { User } from 'src/users/entities/user.entity';
import { Branch } from 'src/branch/entities/branch.entity';
  
  @ObjectType()
  @Entity()
  export class UserBranch {
    @Field()
    @PrimaryColumn()
    userId: string;
  
    @Field()
    @PrimaryColumn()
    branchId: string;
  
    @Field()
    @Column({ default: false })
    canAccess: boolean;
  
    // Relations
  
    @Field(() => User)
    @ManyToOne(() => User, (user) => user.userBranches, { onDelete: 'CASCADE' })
    user: User;
  
    @Field(() => Branch)
    @ManyToOne(() => Branch, (branch) => branch.userBranches, { onDelete: 'CASCADE' })
    branch: Branch;
  }
  