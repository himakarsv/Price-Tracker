import { IsNotEmpty, IsNumber, IsPositive, IsUrl, Min } from 'class-validator';

export class CreateProductDto {
  @IsUrl({ require_protocol: true })
  @IsNotEmpty()
  url: string;

  @IsNumber()
  @IsPositive()
  @Min(1)
  desiredPrice: number;
}
