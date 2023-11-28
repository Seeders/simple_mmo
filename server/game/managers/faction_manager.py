
class FactionManager:
    def __init__(self, world):        
        self.world = world
        self.factions = []
        for i in range(5):
            self.factions.append(self.get_faction(i))

    def add_resources(self, faction, resource_type, amount):
        self.factions[faction]["resources"][resource_type] = self.factions[faction]["resources"][resource_type] + amount
    
    def remove_resources(self, faction, resource_type, amount):
        self.factions[faction]["resources"][resource_type] = self.factions[faction]["resources"][resource_type] - amount
        if self.factions[faction]["resources"][resource_type] < 0:
            self.factions[faction]["resources"][resource_type] = 0
        
    def get_faction(self, faction):
         return { 
                'faction': faction,
                'resources': self.get_starting_resources()
            }
    def get_starting_resources(self):
        return {
                    'wood': 0,
                    'stone': 0
                }
    