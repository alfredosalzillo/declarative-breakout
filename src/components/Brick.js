import PIXI from 'pixi.js';
import { Component } from '../engine/main';
import image from '../../assets/breakout_pieces.png';
import { Sprite } from '../engine/components';

const baseTexture = PIXI.BaseTexture.from(image);

const colors = Object.freeze({
  none: PIXI.Texture.EMPTY,
  blue: new PIXI.Texture(baseTexture, new PIXI.Rectangle(5, 5, 35, 20)),
  green: new PIXI.Texture(baseTexture, new PIXI.Rectangle(5, 25, 35, 20)),
  red: new PIXI.Texture(baseTexture, new PIXI.Rectangle(5, 45, 35, 20)),
});

export default Component(({
  color,
  ...props
}) => Sprite({
  source: colors[color],
  ...props,
}));
