
def position_to_tuple(position_dict):
    """
    Convert a dictionary with 'x' and 'y' keys to a tuple.

    Parameters:
    position_dict (dict): A dictionary with 'x' and 'y' keys representing a position.

    Returns:
    tuple: A tuple representing the position (x, y).
    """
    return (position_dict['x'], position_dict['y'])

def tuple_to_position(position_tuple):
    """
    Convert a tuple to a dictionary with 'x' and 'y' keys.

    Parameters:
    position_tuple (tuple): A tuple representing a position (x, y).

    Returns:
    dict: A dictionary with 'x' and 'y' keys representing the position.
    """
    return {'x': position_tuple[0], 'y': position_tuple[1]}
