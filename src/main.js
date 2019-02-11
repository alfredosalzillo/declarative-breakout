import { Application, Container, Text } from './engine/components';
import {
  Component, render, useDeltaOne, useState,
} from './engine/main';
import Brick from './components/Brick';
import Bar from './components/Bar';
import Ball from './components/Ball';
import Timer from './components/Timer';
import useKeyboard from './hooks/useKeyboard';
import useIntersectionEffect from './hooks/useIntersectionEffect';
import useFps from './hooks/useFps';

const nextDirection = (box1, box2) => {
  const xDistance = box1.x - (box2.x + box2.width / 2);
  const yDistance = box1.y - (box2.y + box2.height / 2);
  return {
    x: xDistance < 0 ? -1 : 1,
    y: yDistance < 0 ? -1 : 1,
  };
};

const width = 700;
const height = 500;

const none = 'none';
const blue = 'blue';

const bricksConfDef = [
  [none, blue, blue, blue, blue, blue, blue, blue],
  [none, blue, blue, blue, blue, blue, blue, none],
  [none, blue, blue, blue, blue, blue, blue, none],
  [none, blue, blue, blue, blue, blue, blue, none],
  [blue, blue, blue, blue, blue, blue, blue, none],
  [none, none, none, none, blue, blue, blue, none],
];
const bricksForLine = 8;

const hasBricks = conf => conf.flat().some(color => color !== none);

const velocity = 150;

const isPlaying = status => status === 'playing';
const isLoose = status => status === 'loose';
const isWin = status => status === 'win';

const App = Component(() => {
  const fps = useFps();
  const [gameStatus, setGameStatus] = useState('playing');
  const [score, setScore] = useState(0);
  const [ballDirection, setBallDirection] = useState({ x: 1, y: 1 });
  const [barDirection, setBarDirection] = useState(0);
  const [ballPosition, setBallPosition] = useState({
    x: width / 2 - 4,
    y: height / 2 - 5 + 50,
  });
  const [barPosition, setBarPosition] = useState({
    x: width / 2 - 35,
    y: height - 30,
  });
  useKeyboard('ArrowLeft', action => setBarDirection(action === 'press' ? -1 : 0));
  useKeyboard('ArrowRight', action => setBarDirection(action === 'press' ? +1 : 0));
  useDeltaOne(() => {
    if (ballPosition.y > height) {
      setGameStatus('loose');
    }
    if (ballPosition.y < 10) {
      setBallDirection({
        ...ballDirection,
        y: +1,
      });
    }
    if (ballPosition.x < 10) {
      setBallDirection({
        ...ballDirection,
        x: +1,
      });
    }
    if (ballPosition.x > (width - 10)) {
      setBallDirection({
        ...ballDirection,
        x: -1,
      });
    }
  });
  useDeltaOne(delta => isPlaying(gameStatus) && setBallPosition(position => ({
    x: position.x + ballDirection.x * velocity * delta / 1000,
    y: position.y + ballDirection.y * velocity * delta / 1000,
  })));
  useDeltaOne((delta) => {
    if (isPlaying(gameStatus) && barDirection) {
      setBarPosition(position => ({
        x: position.x + barDirection * velocity * 2.5 * delta / 1000,
        y: position.y,
      }));
    }
  });
  const ballBounds = {
    ...ballPosition,
    width: 5,
    height: 5,
  };
  const barBounds = {
    ...barPosition,
    width: 70,
    height: 20,
  };
  useIntersectionEffect(
    intersection => setBallDirection(
      nextDirection(ballBounds, intersection),
    ),
    ballBounds,
    barBounds,
  );
  const [bricksConf, setBrickConf] = useState(bricksConfDef);
  const calcBrickX = j => (width - bricksForLine * 40) / 2 + j * 40;
  const calcBrickY = i => 60 + i * 25;
  const bricksDesc = bricksConf
    .map((line, i) => line
      .map((color, j) => ({
        pos: [i, j],
        color,
        position: {
          x: calcBrickX(j),
          y: calcBrickY(i),
        },
      })))
    .flat()
    .filter(brick => brick);
  const bricksPositions = bricksDesc
    .filter(desc => desc.color !== 'none')
    .map(desc => desc.position);
  const bricksBounds = bricksPositions.map(desc => ({
    ...desc,
    width: 35,
    height: 20,
  }));
  useIntersectionEffect(
    (intersection) => {
      setBrickConf(
        bricksConf.map((line, i) => line
          .map((color, j) => ((calcBrickY(i) === intersection.y
              && calcBrickX(j) === intersection.x) ? 'none' : color))),
      );
      setBallDirection(nextDirection(ballBounds, intersection));
      setScore(s => s + 10);
      setGameStatus(hasBricks(bricksConf) ? 'playing' : 'win');
    },
    ballBounds,
    ...bricksBounds,
  );
  const bricks = bricksDesc.map(desc => Brick({
    ...desc,
  }));
  const ball = Ball({
    position: ballPosition,
    color: 'blue',
  });
  const bar = Bar({
    position: barPosition,
    color: 'blue',
  });
  return Container({
    children: [
      Container({
        children: bricks,
      }),
      Container({
        children: [
          bar,
          ball,
        ],
      }),
      Container({
        children: [
          Text({
            text: `${score} point`,
            position: {
              x: 20,
              y: 10,
            },
          }),
          Timer({
            position: {
              x: width - 70,
              y: 10,
            },
          }),
          Text({
            position: {
              x: width - 170,
              y: 10,
            },
            text: `${fps.toPrecision(2)}fps`,
          }),
          isLoose(gameStatus) && Text({
            position: {
              x: width / 2 - 50,
              y: height / 2 - 10,
            },
            text: 'You Loose',
          }),
          isWin(gameStatus) && Text({
            position: {
              x: width / 2 - 50,
              y: height / 2 - 10,
            },
            text: 'You Win',
          }),
        ],
      }),
    ],
  });
});

render(document.getElementById('app'), Component(() => Application({
  width,
  height,
  children: [
    App(),
  ],
})));
