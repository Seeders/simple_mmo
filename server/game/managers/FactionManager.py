
class FactionManager:
    def __init__(self, world):        
        self.world = world
        self.factions = []
        for i in range(5):
            self.factions.append(self.get_faction(i))


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
    