class Town:
    def __init__(self, world, id, faction, center):
        self.world = world
        self.id = id        
        self.faction = faction
        self.center = center
        self.position = { 'x': center[0], 'y': center[1] }
        self.world.spacial_grid.add_entity(self)
        self.stats = {
            "health": 1000,
            "max_health": 1000,
            "defense": 10
        }
        self.name = "Keep"
        self.layout = {}
        self.unit_type = "town"
        self.attacker = {}
        self.structure_counter = 0

    def set_layout(self, layout):
        self.layout = layout

    def to_dict(self):
        serialized_layout = []
        for building_index, building_id in enumerate(self.layout):
            building = self.layout[building_id]
            serialized_layout.append(building.to_dict())
        return {
            "id": self.id,
            "faction": self.faction,            
            "position": self.position,      
            "center": self.center,
            "stats": self.stats,
            "name": self.name,
            "layout": serialized_layout
        }

    def __eq__(self, other):
        return self.id == other.id if other else False
