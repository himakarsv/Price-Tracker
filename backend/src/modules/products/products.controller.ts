import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../../common/pipes/parse-objectid.pipe';
import { SchedulerService } from '../scheduler/scheduler.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('api/products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    @Inject(forwardRef(() => SchedulerService))
    private readonly schedulerService: SchedulerService,
  ) {}

  @Get()
  async findAll(@CurrentUser() user: { userId: string }) {
    const products = await this.productsService.findAllByUser(user.userId);
    return { success: true, data: { products, count: products.length } };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateProductDto,
  ) {
    const product = await this.productsService.create(user.userId, dto);
    return { success: true, data: { product }, message: 'Product added to tracking' };
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: { userId: string },
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    const product = await this.productsService.findOne(id, user.userId);
    return { success: true, data: { product } };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: { userId: string },
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const product = await this.productsService.update(id, user.userId, dto);
    return { success: true, data: { product }, message: 'Product updated successfully' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser() user: { userId: string },
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    await this.productsService.remove(id, user.userId);
    return { success: true, message: 'Product removed from tracking' };
  }

  @Get(':id/history')
  async getHistory(
    @CurrentUser() user: { userId: string },
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    const result = await this.productsService.getPriceHistory(id, user.userId);
    return { success: true, data: result };
  }

  @Post(':id/refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @CurrentUser() user: { userId: string },
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    const product = await this.productsService.findOne(id, user.userId);
    await this.schedulerService.triggerManualScrape(
      id,
      product.url,
      product.platform,
      user.userId,
    );
    return {
      success: true,
      message: 'Price refresh triggered. Check back in a minute.',
    };
  }
}
