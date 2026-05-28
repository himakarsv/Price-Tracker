import { IsBoolean, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(1)
  desiredPrice?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
