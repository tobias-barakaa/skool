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

  async update(id: string, updateInput: UpdateColorPaletteInput, user: User): Promise<ColorPalette> {
    if (!UserRole.SCHOOL_ADMIN) {
      throw new ForbiddenException('Only school administrators can update color palettes');
    }

    const palette = await this.findById(id);
    Object.assign(palette, updateInput);
    return this.colorPalettesRepository.save(palette);
  }
}