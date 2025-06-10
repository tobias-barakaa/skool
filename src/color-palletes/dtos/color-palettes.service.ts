import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ColorPalette } from '../entities/color-palette.entity';
import { UpdateColorPaletteInput } from './update-color-palette.input';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/users/enums/user-role.enum';


@Injectable()
export class ColorPalettesService {
  constructor(
    @InjectRepository(ColorPalette)
    private colorPalettesRepository: Repository<ColorPalette>,
  ) {}

  async findById(id: string): Promise<ColorPalette> {
    const palette = await this.colorPalettesRepository.findOne({ where: { id } });
    if (!palette) {
      throw new NotFoundException('Color palette not found');
    }
    return palette;
  }

  

   
}