import random

# Define a base class for items
class Item:
    def __init__(self, item_id, item_type, item_name, position=None):
        self.id = item_id
        self.type = item_type
        self.name = item_name
        self.position = position  # The position where the item is dropped

    def use(self, player):
        # Define how the item is used
        raise NotImplementedError("Use method must be defined in subclass")

# Define a subclass for Health Potions
class HealthPotion(Item):
    def __init__(self, item_id, position=None):
        super().__init__(item_id, "health_potion", "Health Potion", position)

    def use(self, player):
        # Define the effect of the health potion
        heal_amount = 50  # Example heal amount
        player.stats['health'] = min(player.stats['max_health'], player.stats['health'] + heal_amount)
        return player.stats['health']

# Function to generate a random item
def generate_random_item(next_item_id, position):
    # For now, we only have health potions, but you can add more item types
    return HealthPotion(next_item_id, position)

# Function to generate a specific item
def generate_specific_item(item_type, next_item_id, position):
    item_classes = {
        "health_potion": HealthPotion,
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
