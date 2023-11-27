class Resource:
    def __init__(self, resource_type, sub_type, drop_type, position, stats):
        self.type = resource_type #tree, stone, metal, etc
        self.sub_type = sub_type #pine tree, palm tree, etc
        self.drop_type = drop_type #drops this on kill
        self.position = position
        self.stats = stats
