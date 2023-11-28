import random
import asyncio
from utils.broadcast import broadcast

# Define a base class for items
class Item:
    def __init__(self, item_id, item_type, item_key, item_name, position=None):
        self.id = item_id
        self.item_type = item_type
        self.type = item_key
        self.name = item_name
        self.position = position  # The position where the item is dropped

    def to_dict(self):
        return {
            "id": self.id,
            "item_type": self.item_type,
            "type": self.type,
            "name": self.name,
            "position": self.position
        }
    
    def use(self, game_manager, player, item_index):
        # Define how the item is used
        raise NotImplementedError("Use method must be defined in subclass")

# Define a subclass for Health Potions
class HealthPotion(Item):
    def __init__(self, item_id, position=None):
        super().__init__(item_id, "potion", "health", "Health Potion", position)

    def use(self, game_manager, player, item_index):
        # Define the effect of the health potion
        heal_amount = 50  # Example heal amount
        player.stats['health'] = min(player.stats['max_health'], player.stats['health'] + heal_amount)
        del player.inventory[item_index]
        asyncio.create_task(broadcast({
            "type": "potion_used",
            "playerId": player.id,
            "potionId": self.id,
            "newHealth": player.stats['health']
        }, game_manager.connected, game_manager.connections))
    

class Resource(Item):
    def __init__(self, item_id, item_key, item_name, position=None):
        super().__init__(item_id, "resource", item_key, item_name, position)
    
    def use(self, game_manager, player, item_index):
        # Define the effect of the health potion
        if game_manager.world.town_manager.is_town_at_position(player.position):            
            new_amount = game_manager.world.faction_manager.add_resources(0, self.type, 1)
            del player.inventory[item_index]
            asyncio.create_task(broadcast({
                "type": "update_resource",
                "playerId": player.id,
                "itemId": self.id,
                "resourceType": self.type,
                "newValue": new_amount
            }, game_manager.connected, game_manager.connections))

class Wood(Resource):
    def __init__(self, item_id, position=None):
        super().__init__(item_id, "wood", "Wood", position)


class Stone(Resource):
    def __init__(self, item_id, position=None):
        super().__init__(item_id, "stone", "Stone", position)
       

class Gold(Resource):
    def __init__(self, item_id, position=None):
        super().__init__(item_id, "gold", "Gold", position)
           

# Function to generate a random item
def generate_random_item(next_item_id, position):
    # For now, we only have health potions, but you can add mstone item types
    return HealthPotion(next_item_id, position)

# Function to generate a specific item
def generate_specific_item(item_type, next_item_id, position):
    item_classes = {
        "health_potion": HealthPotion,
        "wood": Wood,
        "stone": Stone,
        "gold": Gold,
        # Add other item types here
    }
    if item_type in item_classes:
        return item_classes[item_type](next_item_id, position)
    else:
        raise ValueError(f"Unknown item type: {item_type}")

# Function to generate an item ID
def generate_item_id():
    # This function would generate a unique item ID
    # For simplicity, we'll just use a random number
    return random.randint(1000, 9999)


