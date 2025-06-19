import { Module } from '@nestjs/common';
import { Organization } from './entities/organizations-entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({

    imports: [TypeOrmModule.forFeature([Organization])],
    providers: [],
    exports: [TypeOrmModule],

})




@Module({
  
})
export class OrganizationsModule {}
