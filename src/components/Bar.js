import PIXI from 'pixi.js';
import { Component } from '../engine/main';
import image from '../../assets/breakout_pieces.png';
import { Sprite } from '../engine/components';

const baseTexture = PIXI.BaseTexture.from(image);

const colors = Object.freeze({
  blue: new PIXI.Texture(baseTexture, new PIXI.Rectangle(5, 150, 70, 20)),
});

export default Component(({
  color,
  ...props
}) => Sprite({
  source: colors[color],
  ...props,
}));
