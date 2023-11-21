class SpatialGrid:
    def __init__(self, world_width, world_height, cell_size):
        self.cell_size = cell_size
        self.columns = int(world_width / cell_size)
        self.rows = int(world_height / cell_size)
        self.grid = [[[] for _ in range(self.columns)] for _ in range(self.rows)]

    def get_cell(self, x, y):
        col = int(x / self.cell_size)
        row = int(y / self.cell_size)
        return col, row

    def add_entity(self, entity):
        col, row = self.get_cell(entity.position['x'], entity.position['y'])
        self.grid[row][col].append(entity)

    def move_entity(self, entity, new_position):
        old_col, old_row = self.get_cell(entity.position['x'], entity.position['y'])
        new_col, new_row = self.get_cell(new_position['x'], new_position['y'])

        if old_col != new_col or old_row != new_row:
            self.grid[old_row][old_col].remove(entity)
            self.grid[new_row][new_col].append(entity)

        entity.position['x'] = new_position['x']
        entity.position['y'] = new_position['y']

    def remove_entity(self, entity):
        col, row = self.get_cell(entity.position['x'], entity.position['y'])
        if entity in self.grid[row][col]:
            self.grid[row][col].remove(entity)


    def get_nearby_entities(self, position, radius, faction):
        col, row = self.get_cell(position['x'], position['y'])
        nearby_entities = []
        for r in range(max(0, row - radius), min(self.rows, row + radius + 1)):
            for c in range(max(0, col - radius), min(self.columns, col + radius + 1)):
                for e in self.grid[r][c]:
                    if e.faction == faction:
                        nearby_entities.append(e)
        return nearby_entities

