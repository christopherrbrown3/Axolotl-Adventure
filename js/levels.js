// Tank themes and the five levels.
export const THEMES = {
  meadow: {
    top: '#38c3d6', bottom: '#0d5f83', sand: '#ecd49a', sand2: '#d8b979',
    pebbles: ['#c9a46a', '#a8c3a0', '#e6c49b', '#9fb7c9'],
    weed: ['#3aa64b', '#2f8a3e', '#56c25f'], far: 'rgba(8,70,95,0.35)',
    room: '#f6e7c8', room2: '#ecd5a8', rays: 'rgba(255,255,255,0.10)',
    decor: ['castle', 'rock', 'rock', 'shell', 'bubbler'], music: 0,
  },
  reef: {
    top: '#2aa7e8', bottom: '#0a3d7a', sand: '#f2dcae', sand2: '#dcc08a',
    pebbles: ['#f19aa8', '#ffd28a', '#c8b6ff', '#ffffff'],
    weed: ['#2fb38a', '#22916f', '#3fd1a0'], far: 'rgba(5,40,90,0.35)',
    room: '#e3f0ff', room2: '#c9dcf4', rays: 'rgba(255,255,255,0.12)',
    decor: ['chest', 'coral', 'coral', 'coral', 'rock', 'shell', 'bubbler'], music: 2,
  },
  cave: {
    top: '#4b3d86', bottom: '#140c2b', sand: '#5d5275', sand2: '#463c5c',
    pebbles: ['#7a6c99', '#9a80c9', '#55486e'],
    weed: ['#7a52b8', '#5e3d96', '#9a6ee0'], far: 'rgba(10,0,30,0.45)',
    room: '#3a3550', room2: '#2c2840', rays: 'rgba(200,170,255,0.06)',
    decor: ['mushroom', 'mushroom', 'crystal', 'crystal', 'rock', 'rock'], music: -3,
  },
  bath: {
    top: '#a6ecfb', bottom: '#3fa6cf', sand: '#fbeed3', sand2: '#ecd9b2',
    pebbles: ['#ffb3c8', '#b3e5ff', '#fff2a8', '#c9f7c4'],
    weed: ['#5fd1ad', '#47b896', '#7de3c0'], far: 'rgba(40,130,170,0.25)',
    room: '#fff4f8', room2: '#ffe1ec', rays: 'rgba(255,255,255,0.16)',
    decor: ['starfish', 'shell', 'shell', 'rock', 'bubbler', 'sponge'], music: 5, suds: true, soap: true,
  },
  room: {
    top: '#5fd0c0', bottom: '#11606a', sand: '#f1d9a3', sand2: '#dcbf82',
    pebbles: ['#ff6b6b', '#4dabf7', '#ffd43b', '#69db7c'],
    weed: ['#3fae6a', '#2f8f55'], far: 'rgba(5,60,70,0.3)',
    room: '#ffe9c2', room2: '#ffd89a', rays: 'rgba(255,255,255,0.12)',
    decor: ['block', 'block', 'rock', 'shell', 'bubbler'], music: 7,
  },
};

export const LEVELS = [
  {
    name: 'Minnow Meadow', goal: 'Suck up all the minnows!', theme: 'meadow', width: 2600,
    creatures: { minnow: 14 }, plants: [1050, 1850], plantSpeed: 0.75, plantReach: 230, seed: 101,
  },
  {
    name: 'Big Fish Reef', goal: 'Suck up all the big fish!', theme: 'reef', width: 3200,
    creatures: { fish: 9 }, plants: [750, 1400, 2050, 2650], plantSpeed: 0.95, plantReach: 280, seed: 202,
  },
  {
    name: 'Evil Axolotl Cave', goal: 'Turn into a SHARK to suck up the evil axolotls!', theme: 'cave', width: 3200,
    creatures: { evil: 6 }, plants: [1000, 1900, 2600], plantSpeed: 1, plantReach: 280, shapeshift: true, seed: 303,
  },
  {
    name: 'Rubber Ducky Bath', goal: 'Catch the duck family, the hopping duckies, and the ducks in bubbles!', theme: 'bath', width: 3000,
    creatures: { duck: 9 }, plants: [650, 1150, 1650, 2150, 2550], plantSpeed: 1.1, plantReach: 320, seed: 404,
  },
  {
    name: 'The Giant Hand', goal: 'When the hand lands, SUCK it! Do it 5 times!', theme: 'room', width: 1500,
    boss: true, seed: 505,
  },
];
