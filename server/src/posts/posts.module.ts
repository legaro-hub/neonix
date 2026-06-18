import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PublicationWorkerService } from './publication-worker.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [PostsController],
  providers: [PostsService, PublicationWorkerService],
  exports: [PostsService],
})
export class PostsModule {}
