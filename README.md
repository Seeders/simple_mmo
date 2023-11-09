# simple_mmo
This project is a multiplayer game server built with Python using `asyncio` and `websockets`. It features a simple combat system, item handling, and terrain generation.

## Features
- Real-time multiplayer gameplay
- Combat system with various enemy types
- Terrain generation using Perlin noise
- Item generation and inventory management
- Health regeneration system
- Player movement and interaction
- Chat system for player communication

## Installation
To run this game server, you will need Python 3.7 or higher. Clone the repository to your local machine, navigate to the project directory, and install the required packages with pip.

## Usage
To start the game server, run the following command in the project directory:

`python ./server/server.py`

Then load up game_client.html in a browser.

## Game Mechanics
# Terrain
The terrain is generated using Perlin noise, creating a varied landscape with different types of tiles like water, sand, grass, forest, and mountains.

# Enemies
Enemies are spawned into the world with different stats and behaviors. Players can engage in combat with these enemies to gain experience and items.

# Items
Items can be found throughout the world or dropped by enemies. Players can pick up and use these items, such as health potions, to aid them in their adventure.

# Health Regeneration
Players regenerate health over time when not in combat, allowing them to recover from battles.

# Chat
Players can communicate with each other using the built-in chat feature.

## Contributing
Contributions to the game server project are welcome. Please feel free to fork the repository, make changes, and submit a pull request.
