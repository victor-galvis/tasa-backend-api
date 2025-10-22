import { Test, TestingModule } from '@nestjs/testing';
import { S3ControllerController } from './s3.controller.controller';

describe('S3ControllerController', () => {
  let controller: S3ControllerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [S3ControllerController],
    }).compile();

    controller = module.get<S3ControllerController>(S3ControllerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
