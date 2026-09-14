// Единая цветокоррекция фото базы: чуть тише цвет и тёплый баланс, контраст не трогаем (иначе «дымка»),
// лёгкая резкость после уменьшения до размера сайта
import sharp from 'sharp';
export const grade = (input) =>
  sharp(input)
    .rotate()
    .flatten({ background: '#ffffff' })
    .modulate({ saturation: 0.93 })
    .recomb([
      [1.02, 0.01, 0],
      [0, 1.0, 0],
      [0, 0.01, 0.96],
    ])
    .sharpen({ sigma: 0.6, m1: 0.5, m2: 1.5 });
