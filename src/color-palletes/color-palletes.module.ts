import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ColorPalettesService } from './color-palettes.service';
import { ColorPalettesResolver } from './color-palettes.resolver';
import { ColorPalette } from './entities/color-palette.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ColorPalette])],
  providers: [ColorPalettesService, ColorPalettesResolver],
  exports: [ColorPalettesService],
})
export class ColorPalettesModule {}
