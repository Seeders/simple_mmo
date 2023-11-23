def tech_tree ():
    return [
        {
            "name": "axe",
            "requires": [
                {
                    "type": "wood",
                    "amount": 2
                },
                {
                    "type": "stone",
                    "amount": 1
                }
            ]
        },
        {
            "name": "pickaxe",
            "requires": [
                {
                    "type": "wood",
                    "amount": 2
                },
                {
                    "type": "stone",
                    "amount": 1
                }
            ]
        },
        {
            "name": "hammer",
            "requires": [
                {
                    "type": "wood",
                    "amount": 1
                },
                {
                    "type": "stone",
                    "amount": 1
                }
            ]
        },
        {
            "name": "sword",
            "requires": [
                {
                    "type": "metal",
                    "amount": 3
                },
                {
                    "type": "wood",
                    "amount": 1
                }
            ]
        },
        {
            "name": "bow",
            "requires": [
                {
                    "type": "wood",
                    "amount": 3
                },
                {
                    "type": "string",
                    "amount": 1
                }
            ]
        },
        {
            "name": "leather_armor",
            "requires": [
                {
                    "type": "leather",
                    "amount": 5
                }
            ]
        },
        {
            "name": "chainmail",
            "requires": [
                {
                    "type": "metal",
                    "amount": 10
                }
            ]
        },
        {
            "name": "house",
            "requires": [
                {
                    "type": "wood",
                    "amount": 1
                },
                {
                    "type": "stone",
                    "amount": 1
                }
            ]
        },
        {
            "name": "tower",
            "requires": [
                {
                    "type": "wood",
                    "amount": 0
                },
                {
                    "type": "stone",
                    "amount": 0
                }
            ]
        },
        {
            "name": "blacksmith",
            "requires": [
                {
                    "type": "wood",
                    "amount": 15
                },
                {
                    "type": "stone",
                    "amount": 15
                },
                {
                    "type": "metal",
                    "amount": 5
                }
            ]
        },
        {
            "name": "tavern",
            "requires": [
                {
                    "type": "wood",
                    "amount": 30
                },
                {
                    "type": "stone",
                    "amount": 15
                },
                {
                    "type": "metal",
                    "amount": 5
                },
                {
                    "type": "glass",
                    "amount": 10
                },
                {
                    "type": "cloth",
                    "amount": 5
                }
            ]
        },
        {
            "name": "docks",
            "requires": [
                {
                    "type": "wood",
                    "amount": 50
                },
                {
                    "type": "stone",
                    "amount": 20
                },
                {
                    "type": "metal",
                    "amount": 10
                },
                {
                    "type": "rope",
                    "amount": 15
                }
            ]
        },
        {
            "name": "temple",
            "requires": [
                {
                    "type": "stone",
                    "amount": 50
                },
                {
                    "type": "wood",
                    "amount": 20
                },
                {
                    "type": "metal",
                    "amount": 15
                },
                {
                    "type": "glass",
                    "amount": 20
                },
                {
                    "type": "cloth",
                    "amount": 10
                }
            ]
        },
        {
            "name": "market",
            "requires": [
                {
                    "type": "wood",
                    "amount": 25
                },
                {
                    "type": "stone",
                    "amount": 10
                },
                {
                    "type": "cloth",
                    "amount": 20
                },
                {
                    "type": "metal",
                    "amount": 5
                }
            ]
        },
        {
            "name": "barracks",
            "requires": [
                {
                    "type": "stone",
                    "amount": 40
                },
                {
                    "type": "wood",
                    "amount": 30
                },
                {
                    "type": "metal",
                    "amount": 20
                },
                {
                    "type": "cloth",
                    "amount": 15
                },
                {
                    "type": "leather",
                    "amount": 10
                }
            ]
        },
        {
            "name": "spellbook",
            "requires": [
                {
                    "type": "paper",
                    "amount": 5
                },
                {
                    "type": "magic_essence",
                    "amount": 3
                }
            ]
        },
        {
            "name": "health_potion",
            "requires": [
                {
                    "type": "herbs",
                    "amount": 1
                },
                {
                    "type": "water",
                    "amount": 1
                },
                {
                    "type": "magic_essence",
                    "amount": 1
                }
            ]
        },
        {
            "name": "road",
            "requires": [
                {
                    "type": "stone",
                    "amount": 10
                }
            ]
        }
    ]
