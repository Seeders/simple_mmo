class WorkerNPC:
    def __init__(self, id, type, position):
        self.id = id
        self.type = type
        self.position = position
        self.isBusy = False
        self.happiness = 100  # A measure of NPC's contentment

    def assign_task(self, task):
        if not self.isBusy:
            self.isBusy = True
            # Implement task logic here
            # ...
            self.complete_task()

    def complete_task(self):
        self.isBusy = False
        # Adjust happiness based on treatment, task difficulty, etc.
        # ...

    def interact(self, player):
        # Implement interaction logic
        # Dialogue, quests, etc.
        # ...
        pass

    def find_nearest_tree(self, world_map):
        # Logic to find the nearest tree
        # Return the position of the nearest tree
        pass

    def gather_wood(self, tree_position):
        # Logic to gather wood from the tree
        # Update inventory or wood count
        pass

    def find_nearest_town(self, world_map):
        # Logic to find the nearest town
        # Return the position of the nearest town
        pass

    def return_to_town(self, town_position):
        # Logic to move to the town and deliver the wood
        pass

    def perform_wood_gathering_task(self, world_map):
        tree_position = self.find_nearest_tree(world_map)
        self.gather_wood(tree_position)
        town_position = self.find_nearest_town(world_map)
        self.return_to_town(town_position)
