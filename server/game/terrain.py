from noise import pnoise2

class Terrain:
    def __init__(self, width, height):
        self.width = width
        self.height = height
        self.terrain = self.generate_terrain(width, height)

    def generate_terrain(self, width, height, scale=0.04):
        terrain = []
        for y in range(height):
            row = []
            for x in range(width):
                noise_value = pnoise2(x * scale, y * scale)
                if noise_value < -0.05:
                    tile = 0
                elif -0.05 <= noise_value < 0.06:
                    tile = 1
                elif 0.06 <= noise_value < 0.4:
                    tile = 2
                elif 0.4 <= noise_value < 0.6:
                    tile = 3
                else:
                    tile = 4
                row.append(tile)
            terrain.append(row)
        return terrain
