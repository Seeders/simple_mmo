import random
import asyncio
from ...utils.broadcast import broadcast
from ..structure import Structure
from ..town import Town
class TownManager:
    def __init__(self, world):        
        self.world = world
        self.building_types = ['house', 'market', 'tavern', 'blacksmith', 'temple', 'barracks', 'dock']
        self.towns = self.place_towns()

    def place_towns(self):
        # Define corner positions for the towns
        padding = min(10, self.terrain.width // 2, self.terrain.height // 2)

        # Define corner positions with padding
        opposing_town_1 = (padding, self.terrain.height - 1 - padding)  # Bottom left
        opposing_town_2 = (self.terrain.width - 1 - padding, padding)  # Top right
        neutral_town_1 = (padding, padding)  # Top left
        neutral_town_2 = (self.terrain.width - 1 - padding, self.terrain.height - 1 - padding)  # Bottom right
        bandit_town = (int(self.terrain.width / 2), int(self.terrain.height / 2))  # Bottom right

        town_centers = [opposing_town_1, opposing_town_2, neutral_town_1, neutral_town_2, bandit_town]
        towns = []
        town_type = 0
        for town_center in town_centers:
            town_width = 10
            town_height = 10
            total_buildings = 15
            building_counts = {
                'house': 10,
                'market': 2,
                'tavern': 2,
                'blacksmith': 1,
                'temple': 1,
                'barracks': 1,
                'dock': 3
            }
            town = Town(self, town_type, town_type, town_center)
            if town_center == opposing_town_1 or town_center == opposing_town_2:
                town_layout = {} 
            else:
                town_layout = self.generate_town(town, town_center, town_type, town_width, town_height, total_buildings, building_counts)
            
            town.set_layout(town_layout)
            towns.append(town)
            town_type += 1

        return towns
    
    def generate_town(self, town, town_center, faction, town_width, town_height, total_buildings, building_counts):
        town_layout = {}
        building_locations = []

        # Generate building positions
        while len(building_locations) < total_buildings:
            x_offset = random.randint(-town_width // 2, town_width // 2)
            y_offset = random.randint(-town_height // 2, town_height // 2)
            if x_offset == 0 and y_offset == 0: 
                continue  # Avoid spawning on town center
            x, y = town_center[0] + x_offset, town_center[1] + y_offset

            position = {'x': x, 'y': y}
            if self.is_land(x, y, self.terrain.terrain) and self.is_tree_at_position(position) == -1 and self.is_stone_at_position(position) == -1 and position not in building_locations:
                building_locations.append(position)

        counts = []
        for building_name in building_counts:
            counts.append(building_counts[building_name])
        # Assign building types based on neighboring tiles
        for position in building_locations:
            building_type = self.determine_building_type(town_center, position, building_counts)
            building = {}
            if counts[building_type] > 0:
                counts[building_type] = counts[building_type] - 1                
                building = Structure(self, town.structure_counter, faction, self.building_types[building_type], position)
                town.structure_counter = town.structure_counter + 1
            else:
                building = Structure(self, town.structure_counter, faction, self.building_types[0], position)
                town.structure_counter = town.structure_counter + 1
                
            town_layout[building.id] = building# default to hut

        return town_layout
    
    def build_structure(self, data):
        faction = data["faction"]
        structure = data["item"]
        position = data["position"]
        requires = structure["requires"]
        player = self.game_manager.connected[data["playerId"]]
        canAfford = True
        for price in requires:
            type = price["type"]
            amount = price["amount"]
            if player.stats["resources"][type] < amount:
                canAfford = False


        if canAfford:
            for price in requires:
                type = price["type"]
                amount = price["amount"]            
                player.stats["resources"][type] = player.stats["resources"][type] - amount

            if faction < len(self.towns):
                town = self.towns[faction]
                if town:
                    building = Structure(self, town.structure_counter, faction, structure["name"], position)
                    town.structure_counter = town.structure_counter + 1
                    town.layout[building.id] = building

            towns = []
            for town in self.towns:
                towns.append(town.to_dict())
            asyncio.create_task(broadcast({
                "type": "update_towns",
                "towns": towns
            }, self.game_manager.connected, self.game_manager.connections))

            asyncio.create_task(broadcast({
                "type": "update_player_resources",
                "playerId": player.id,
                "resources": player.stats["resources"]
            }, self.game_manager.connected, self.game_manager.connections))



    def determine_building_type(self, town_center, position, building_counts):
        """
        Determines the building type based on neighboring tiles.

        :param position: Dictionary with 'x' and 'y' keys representing the building position.
        :return: Integer representing the building type.
        """
        distance_to_town = ((town_center[0] - position['x'])**2 + (town_center[1] - position['y'])**2)**0.5

        # Example logic for determining building type
        if self.is_tile_type_nearby(0, position):
            dock_index = self.building_types.index('dock')
            return dock_index
        if distance_to_town < 4:
            return random.randint(1, 4)
        else:
            # Other logic to determine building type
            return 0  # Example types
