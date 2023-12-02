import random
import asyncio
from utils.broadcast import broadcast, broadcastCombatLog
from ..world import World
from ..config.overworld_config import perimeter_size, perimeter_type, terrain_weights
class OverworldManager:
    def __init__(self, game_manager, size, map_types):
        self.game_manager = game_manager
        self.size = size
        self.map_types = map_types        
        self.discovered_tiles = []
        self.map = []
        self.world_instances = {}  # Key: (x, y) tile coordinates, Value: GameManager instance
        self.player_locations = {}  # Key: player_id, Value: (x, y) location
        self.state = 'explore'
        self.initialize_overworld()
    

    def initialize_overworld(self):
        self.discovered_tiles = [[False for _ in range(self.size)] for _ in range(self.size)]
        self.map = [[-1 for _ in range(self.size)] for _ in range(self.size)]
            
        # Call this function before exploring the map to create rivers
        #generateRivers()  
        for i in range(1, int(perimeter_size) + 5):
            self.explore_perimeter(i, True)  # Outermost perimeter
        
        #Now explore the rest of the map
        for y in range(2, self.size - 2):
            for x in range(2, self.size - 2):
                self.explore_tile(x, y, True)
        #lookAround() generate story
    
    def explore_perimeter(self, perimeterLevel, skipOptions=False):
        # Define the start and end points for the loop based on perimeter level
        start = perimeterLevel - 1
        end = self.size - perimeterLevel
        
        # Explore the top and bottom rows
        for x in range(start, end + 1):
            self.explore_tile(x, start, skipOptions)  # Top row
            self.explore_tile(x, end, skipOptions)    # Bottom row

        # Explore the left and right columns
        for y in range(start, end + 1):
            self.explore_tile(start, y, skipOptions)  # Left column
            self.explore_tile(end, y, skipOptions)    # Right column

    def explore_direction(self, position, direction):
        if self.state == 'explore':
            newPosition = self.get_neightbor_position(position, direction)
        if self.is_valid_position(newPosition):
            self.explore_tile(newPosition['x'], newPosition['y']);	
        else:
            pass #announce('Invalid position')	


    def explore_tile(self, x, y, skipOptions=False):
        self.discover_tile(x, y)
        if self.map[y][x] == -1:
            if self.is_edge_position({'x': x, 'y': y}):
                self.map[y][x] = perimeter_type
                #lookAround() generate story			
            else:
                options = self.get_neighbor_options(x, y)
                if len(options) == 0:
                    self.map[y][x] = 0  # Default to 'River' if no options
                elif skipOptions:
                    self.map[y][x] = options[0] # Set the chosen terrain type
                    self.state = 'explore'	
                else:
                    self.send_options_to_player(options, x, y)
        else:
            pass
            #lookAround(skipOptions)

        if not skipOptions:
            self.send_map()

    def discover_tile(self, x, y):
        self.discovered_tiles[y][x] = True        
        #clearStory()

    def is_edge_position(self, position):
        return position['x'] <= perimeter_size - 1 or position['x'] >= self.size - perimeter_size or position['y'] <= perimeter_size - 1 or position['y'] >= self.size - perimeter_size

    def get_neighbor_options(self, x, y):
        directions = ['north', 'south', 'east', 'west']
        validTypes = set(self.map_types)  # Start with all tile types as valid

        # Exclude 'River' from valid types
        validTypes.discard('river')
        for direction in directions:
            neighborPos = self.get_neightbor_position({'x': x, 'y': y}, direction)

            if self.is_valid_position(neighborPos):
                neighborType = self.map_types[self.map[neighborPos['y']][neighborPos['x']]]
                if self.map[neighborPos['y']][neighborPos['x']] != -1:
                    if self.is_edge_position(neighborPos):
                        neighborType = self.map_types[perimeter_type]
                    print('neighborType:', neighborType)
                    if terrain_weights.get(neighborType):
                        currentTypes = set(terrain_weights[neighborType].keys())
                        validTypes = {t for t in validTypes if t in currentTypes and terrain_weights[neighborType][t] > 0}

        # If no valid types are found (unlikely), default to a random type (excluding River)
        if not validTypes:
            print('no valid types')
            typesWithoutRiver = [self.map_types.index(t) for t in self.map_types if t != 'river']
            return [random.choice(typesWithoutRiver)]

        print('validTypes', validTypes)
        # Accumulate weights for valid types
        neighborWeights = {}
        for type in validTypes:
            neighborWeights[type] = 0
            for direction in directions:
                neighborPos = self.get_neightbor_position({'x': x, 'y': y}, direction)
                if self.is_valid_position(neighborPos):
                    neighborType =  self.map_types[self.map[neighborPos['y']][neighborPos['x']]]
                    if self.map[neighborPos['y']][neighborPos['x']] != -1 and terrain_weights.get(neighborType, {}).get(type):
                        neighborWeights[type] += terrain_weights[neighborType][type]

        print('neighborWeights', neighborWeights)
        # Convert the accumulated weights into an array of options
        weightedOptions = []
        for type, weight in neighborWeights.items():
            if weight > 0:
                weightedOptions.extend([type] * weight)


        # Shuffle the weightedOptions to randomize their order
        random.shuffle(weightedOptions)

        # Randomly pick up to 3 unique options
        chosenOptions = []
        while len(chosenOptions) < 3 and weightedOptions:
            option = random.choice(weightedOptions)
            weightedOptions.remove(option)
            if self.map_types.index(option) not in chosenOptions:
                chosenOptions.append(self.map_types.index(option))

        print('selecting', self.map_types[chosenOptions[0]])
        return chosenOptions


    def send_map(self):        
        #send the map to players
        asyncio.create_task(broadcast({
            "type": "overworld_map_update",
            "map": self.map,
        }, self.game_manager.connected, self.game_manager.connections))

    def send_options_to_player(self, options, x, y):        
        #send tile options to players
        asyncio.create_task(broadcast({
            "type": "overworld_map_options",
            "options": options,
            "position": { 'x': x, 'y': y },            
        }, self.game_manager.connected, self.game_manager.connections))

    def is_valid_position(self, position):
        return position['x'] >= 0 and position['x'] < self.size and position['y'] >= 0 and position['y'] < self.size

    def get_neightbor_position(self, position, direction):
        if direction == 'north':
            return {'x': position['x'], 'y': position['y'] - 1}
        elif direction == 'south':
            return {'x': position['x'], 'y': position['y'] + 1}
        elif direction == 'east':
            return {'x': position['x'] + 1, 'y': position['y']}
        elif direction == 'west':
            return {'x': position['x'] - 1, 'y': position['y']}
        else:
            return position.copy()

    def move_player(self, player_id, x, y):
        # Update player location
        self.player_locations[player_id] = { 'x': x, 'y': y }
        self.discover_tile(x, y) 
        # Handle logic to instantiate/load a GameManager if not already present
        if (x, y) not in self.world_instances:
            self.load_tile(x, y)
        # Additional logic here

    def load_tile(self, x, y):
        # Load a World for the specified tile
        world = World(self, self.game_manager, { 'x': x, 'y': y })
        self.world_instances[(x, y)] = world
        return world

    def get_world_instance(self, x, y):
        if (x, y) not in self.world_instances:
            self.load_tile(x, y)
        # Return the World instance for the specified tile
        return self.world_instances.get((x, y))
    
    def get_world_of_player(self, player_id):
        player_location = self.player_locations.get(player_id)
        if player_location:
            return self.get_world_instance(player_location['x'], player_location['y'])
        return None