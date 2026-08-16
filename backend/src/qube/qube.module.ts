import { Module } from '@nestjs/common';
import { QubeController } from './qube.controller';
import { QubeService } from './qube.service';
import { PropertiesModule } from '../properties/properties.module';

@Module({
  imports: [PropertiesModule],
  controllers: [QubeController],
  providers: [QubeService],
  exports: [QubeService],
})
export class QubeModule {}
