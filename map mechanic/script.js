// Constants and Variables
const tileTypes = ['Ocean', 'Forest', 'Mountain', 'River', 'Desert', 'Mystical', 'Grassland', 'Coast', 'Volcanic', 'Ruins'];
let map = [];
let discoveredTiles = [];
let map_size = 32;
let start_pos = { x: map_size / 2, y: map_size - 7 };
let current_position = { ...start_pos };
let perimeter = 'Ocean';
let perimeterSize = 5;
let state = 'explore';
let playerProgress = {
    tiles: new Set(),
    features: new Set(),
	details: new Set(),
	characters: new Set(),
    templates: new Set(),
    timesOfDay: new Set(),
    statesOfTile: new Set(),
    conditionalStories: new Set()
};
const terrainWeights = {
    'Ocean': {
        'Ocean': 50, 'Coast': 25, 'River': 5, 'Grassland': 0, 'Forest': 0, 'Desert': 0, 'Mountain': 0, 'Ruins': 0, 'Mystical': 0, 'Volcanic': 0
    },
    'Coast': {
        'Ocean': 20, 'Coast': 40, 'River': 5, 'Grassland': 40, 'Forest': 0, 'Desert': 0, 'Mountain': 0, 'Ruins': 0, 'Mystical': 0, 'Volcanic': 0
    },
    'River': {
       'Ocean': 0, 'Coast': 25, 'River': 5, 'Grassland': 30, 'Forest': 10, 'Desert': 0, 'Mountain': 5, 'Ruins': 0, 'Mystical': 0, 'Volcanic': 0
    },
    'Grassland': {
        'Ocean': 0, 'Coast': 10, 'River': 3, 'Grassland': 30, 'Forest': 25, 'Desert': 5, 'Mountain': 5, 'Ruins': 0, 'Mystical': 0, 'Volcanic': 0
    },
    'Forest': {
        'Ocean': 0, 'Coast': 0, 'River': 2, 'Grassland': 25, 'Forest': 40, 'Desert': 0, 'Mountain': 10, 'Ruins': 1, 'Mystical': 0, 'Volcanic': 0
    },
    'Desert': {
        'Ocean': 0, 'Coast': 0, 'River': 1, 'Grassland': 5, 'Forest': 0, 'Desert': 50, 'Mountain': 5, 'Ruins': 1, 'Mystical': 1, 'Volcanic': 0
    },
    'Mountain': {
        'Ocean': 0, 'Coast': 0, 'River': 1, 'Grassland': 10, 'Forest': 15, 'Desert': 25, 'Mountain': 40, 'Ruins': 1, 'Mystical': 0, 'Volcanic': 0
    },
    'Ruins': {
        'Ocean': 0, 'Coast': 0, 'River': 0, 'Grassland': 10, 'Forest': 20, 'Desert': 5, 'Mountain': 10, 'Ruins': 50, 'Mystical': 5, 'Volcanic': 0
    },
    'Mystical': {
        'Ocean': 0, 'Coast': 0, 'River': 0, 'Grassland': 0, 'Forest': 20, 'Desert': 0, 'Mountain': 10, 'Ruins': 20, 'Mystical': 50, 'Volcanic': 0
    },
    'Volcanic': {
        'Ocean': 0, 'Coast': 0, 'River': 0, 'Grassland': 0, 'Forest': 0, 'Desert': 20, 'Mountain': 30, 'Ruins': 0, 'Mystical': 0, 'Volcanic': 50
    }
};
const directionOffsets = {
    'North': { x: 0, y: -1 },
    'South': { x: 0, y: 1 },
    'East': { x: 1, y: 0 },
    'West': { x: -1, y: 0 }
};
const storyContent = {
	'Coast': {
		'descriptors': { 
			'rocky': { 'text': 'rocky', 'requirements': {} }, 
			'sandy': { 'text': 'sandy', 'requirements': {} }, 
			'fog-covered': { 'text': 'fog-covered', 'requirements': {} }, 
			'sun-kissed': { 'text': 'sun-kissed', 'requirements': {} }, 
			'stormy': { 'text': 'stormy', 'requirements': {} },
		},
		'features': {
			'shipwreck': { 'text': 'a shipwreck half-buried in sand', 'requirements': {} },
			'lighthouse': { 'text': 'a lighthouse standing tall', 'requirements': {} },
			'tidePool': { 'text': 'a tide pool teeming with life', 'requirements': {} },
			'cliffs': { 'text': 'cliffs overlooking the sea', 'requirements': {} },
			'fishingVillage': { 'text': 'a quaint fishing village', 'requirements': {} }
		},
		'details': {
			'gullsCrying': { 'text': 'the cry of gulls overhead', 'requirements': {} },
			'wavesLapping': { 'text': 'waves lapping gently at the shore', 'requirements': {} },
			'saltyBreeze': { 'text': 'a salty breeze', 'requirements': {} },
			'driftwood': { 'text': 'driftwood scattered along the beach', 'requirements': {} },
			'footprints': { 'text': 'footprints in the wet sand', 'requirements': {} }
		},
		'timesOfDay': {
			'sunrise': { 'text': 'sunrise over the horizon', 'requirements': {} },
			'noon': { 'text': 'the bright noon sun', 'requirements': {} },
			'sunset': { 'text': 'sunset casting orange hues', 'requirements': {} },
			'moonlit': { 'text': 'a moonlit beach', 'requirements': {} }
		},
		'statesOfTile': {
			'tidesIn': { 'text': 'tides coming in', 'requirements': {} },
			'tidesOut': { 'text': 'tides going out', 'requirements': {} },
			'sunnyBeach': { 'text': 'a beach basking in sunshine', 'requirements': {} },
			'seaMist': { 'text': 'a coast engulfed in a sea mist', 'requirements': {} }
		},
		'characters': {
			'beachcombers': { 'text': 'a group of beachcombers', 'requirements': {} },
			'fishermen': { 'text': 'fishermen hauling in their catch', 'requirements': {} },
			'surfer': { 'text': 'a lone surfer braving the waves', 'requirements': {} },
			'children': { 'text': 'children building sandcastles', 'requirements': {} }
		},
		'templates': {
			'morningDiscovery': { 
				'text': "As the first light of [TimeOfDay] touches the [Descriptor] coastline, you discover [Feature]. Nearby, [Detail] catches your attention.",
				'requirements': {}
			},
			'eveningReflection': {
				'text': "The [Descriptor] coast under the [TimeOfDay] sky presents a serene view. You notice [Feature] while [EventCharacter] in the background.",
				'requirements': {}
			},
			'mysticalShore': {
				'text': "The [StateOfTile] coast seems almost [Descriptor] today. As you explore, you come across [Feature], where [Detail] adds to the mystique.",
				'requirements': {}
			},
			'sunsetAdventure': {
				'text': "With the [TimeOfDay] casting its glow, the [Descriptor] coast reveals [Feature]. You can't miss [Detail] as [EventCharacter] nearby.",
				'requirements': {}
			},
			'stormyEncounter': {
				'text': "A [Descriptor] day at the coast. Amidst [Feature], you feel the full force of the [StateOfTile] weather, and [Detail] surrounds you.",
				'requirements': {}
			}
		}
	},
	'Grassland': {
		'descriptors': {
			'vast': { 'text': 'vast', 'requirements': {} },
			'endless': { 'text': 'endless', 'requirements': {} },
			'sprawling': { 'text': 'sprawling', 'requirements': {} },
			'serene': { 'text': 'serene', 'requirements': {} },
			'tranquil': { 'text': 'tranquil', 'requirements': {} }
		},
		'features': {
			'solitaryTree': { 'text': 'a solitary tree', 'requirements': {} },
			'herdOfBison': { 'text': 'a herd of bison', 'requirements': {} },
			'smallCreek': { 'text': 'a small creek', 'requirements': {} },
			'abandonedCampsite': { 'text': 'an abandoned campsite', 'requirements': {} },
			'circleOfStones': { 'text': 'a circle of stones', 'requirements': {} }
		},
		'details': {
			'distantThunder': { 'text': 'the sound of distant thunder', 'requirements': {} },
			'animalTracks': { 'text': 'tracks of a wandering animal', 'requirements': {} },
			'birdsNest': { 'text': 'a bird’s nest', 'requirements': {} },
			'wildflowers': { 'text': 'wildflowers', 'requirements': {} }
		},
		'timesOfDay': {
			'dawn': { 'text': 'dawn', 'requirements': {} },
			'midday': { 'text': 'midday', 'requirements': {} },
			'dusk': { 'text': 'dusk', 'requirements': {} },
			'moonlitNight': { 'text': 'moonlit night', 'requirements': {} }
		},
		'statesOfTile': {
			'lushGreen': { 'text': 'lush and green', 'requirements': {} },
			'dryGolden': { 'text': 'dry and golden', 'requirements': {} },
			'freshlyRained': { 'text': 'freshly rained upon', 'requirements': {} },
			'morningDew': { 'text': 'covered in morning dew', 'requirements': {} },
			'suddenRainstorm': { 'text': 'a sudden rainstorm', 'requirements': {} },
		},
		'characters': {
			'lostTraveler': { 'text': 'a lost traveler seeking direction', 'requirements': {} },
			'nomads': { 'text': 'a group of nomads setting up camp', 'requirements': {} },
			'trader': { 'text': 'an eager trader', 'requirements': {} },
			'sleepingFigure': { 'text': 'a sleeping figure', 'requirements': {} }
		},
		'templates': {
			'sunriseMoment': {
				'text': "As the [TimeOfDay] breaks, the [Descriptor] grassland reveals [Feature]. You take in [Detail], feeling at peace.",
				'requirements': {}
			},
			'middayDiscovery': {
				'text': "Under the [TimeOfDay] sun, the [Descriptor] grassland is alive. You come across [Feature], where [Detail] unveils a hidden secret.",
				'requirements': {}
			},
			'eveningSerenade': {
				'text': "The [Descriptor] grassland under [TimeOfDay] skies hums with life. [EventCharacter] amidst [Feature], while [Detail] fills the air.",
				'requirements': {}
			},
			'nighttimeWonder': {
				'text': "In the [TimeOfDay], the [Descriptor] grassland is a different world. [Feature] stands out, bathed in moonlight, as [Detail] echoes in the distance.",
				'requirements': {}
			}
		}
	},
	'Ocean': {
		'descriptors': {
			'vast': { 'text': 'vast', 'requirements': {} },
			'endless': { 'text': 'endless', 'requirements': {} },
			'serene': { 'text': 'serene', 'requirements': {} },
			'tempestuous': { 'text': 'tempestuous', 'requirements': {} }
		},
		'features': {
			'distantShip': { 'text': 'a distant ship', 'requirements': {} },
			'breachingWhale': { 'text': 'a breaching whale', 'requirements': {} },
			'remoteIsland': { 'text': 'a remote island', 'requirements': {} },
			'floatingDebris': { 'text': 'floating debris', 'requirements': {} },
			'schoolOfDolphins': { 'text': 'a school of dolphins', 'requirements': {} }
		},
		'details': {
			'seagullsCall': { 'text': 'the call of seagulls', 'requirements': {} },
			'wavesCrashing': { 'text': 'waves crashing against the boat', 'requirements': {} },
			'distantStorm': { 'text': 'a distant storm', 'requirements': {} },
			'calmSea': { 'text': 'a calm sea', 'requirements': {} },
			'saltSmell': { 'text': 'the smell of salt in the air', 'requirements': {} }
		},
		'timesOfDay': {
			'sunrise': { 'text': 'sunrise', 'requirements': {} },
			'highNoon': { 'text': 'high noon', 'requirements': {} },
			'sunset': { 'text': 'sunset', 'requirements': {} },
			'starryNight': { 'text': 'a starry night', 'requirements': {} }
		},
		'statesOfTile': {
			'calmPeaceful': { 'text': 'calm and peaceful', 'requirements': {} },
			'stormyRough': { 'text': 'stormy and rough', 'requirements': {} },
			'foggyEerie': { 'text': 'foggy and eerie', 'requirements': {} },
			'crystalClear': { 'text': 'crystal clear', 'requirements': {} }
		},
		'characters': {
			'piratesCrew': { 'text': 'a crew of pirates', 'requirements': {} },
			'lostSeaCreature': { 'text': 'a lost sea creature', 'requirements': {} },
			'explorersGroup': { 'text': 'a group of explorers', 'requirements': {} },
			'oldFisherman': { 'text': 'an old fisherman', 'requirements': {} }
		},
		'templates': {
			'mysticalSighting': {
				'text': "On the [Descriptor] ocean, you spot [Feature]. [Detail] and [EventCharacter] add to the enigmatic atmosphere.",
				'requirements': {}
			},
			'stormyChallenge': {
				'text': "The [Descriptor] sea roars as you navigate through [Feature]. [Detail] surrounds you, while [EventCharacter] struggles to keep pace.",
				'requirements': {}
			},
			'peacefulVoyage': {
				'text': "A [Descriptor] journey across the ocean. [Feature] appears near the horizon, as [Detail] complements the [StateOfTile] waters.",
				'requirements': {}
			},
			'nightReflections': {
				'text': "Under the [TimeOfDay], the ocean seems [Descriptor]. [Feature] glistens in the distance, and [Detail] fills the air, observed by [EventCharacter].",
				'requirements': {}
			}
		}
	},
    'Forest': {
		'descriptors': {
			'lush': { 'text': 'lush', 'requirements': {} },
			'dense': { 'text': 'dense', 'requirements': {} },
			'ancient': { 'text': 'ancient', 'requirements': {} },
			'verdant': { 'text': 'verdant', 'requirements': {} }
		},
		'features': {
			'hiddenGlade': { 'text': 'a hidden glade', 'requirements': {} },
			'toweringOak': { 'text': 'a towering oak', 'requirements': {} },
			'babblingBrook': { 'text': 'a babbling brook', 'requirements': {} },
			'fallenLog': { 'text': 'a fallen log', 'requirements': {} },
			'hiddenCave': { 'text': 'a hidden cave', 'requirements': {} },
		},
		'details': {
			'rustlingLeaves': { 'text': 'rustling leaves', 'requirements': {} },
			'animalCalls': { 'text': 'distant animal calls', 'requirements': {} },
			'mossCarpet': { 'text': 'a carpet of moss', 'requirements': {} },
			'sunbeams': { 'text': 'sunbeams breaking through the canopy', 'requirements': {} },
			'suddenSilence': { 'text': 'a sudden silence', 'requirements': {} }
		},
		'timesOfDay': {
			'dawn': { 'text': 'dawn', 'requirements': {} },
			'midday': { 'text': 'midday', 'requirements': {} },
			'dusk': { 'text': 'dusk', 'requirements': {} },
			'moonlitNight': { 'text': 'moonlit night', 'requirements': {} }
		},
		'statesOfTile': {
			'overgrown': { 'text': 'overgrown', 'requirements': {} },
			'fogLaden': { 'text': 'fog-laden', 'requirements': {} },
			'sunDappled': { 'text': 'sun-dappled', 'requirements': {} },
			'shadowFilled': { 'text': 'shadow-filled', 'requirements': {} }
		},
		'characters': {
			'wanderingDeer': { 'text': 'a wandering deer', 'requirements': {} },
			'elusiveFox': { 'text': 'an elusive fox', 'requirements': {} },
			'groupOfHikers': { 'text': 'a group of hikers', 'requirements': {} },
			'solitaryRanger': { 'text': 'a solitary ranger', 'requirements': {} }
		},
		'templates': {
			'gladeEncounter': {
				'text': "In the [StateOfTile] [Descriptor] forest, you find [Feature]. You hear [Detail] and see [EventCharacter] nearby.",
				'requirements': {}
			},
			'canopyMystery': {
				'text': "Under the [TimeOfDay] light, the [Descriptor] forest's [Feature] casts intriguing shadows. [Detail] adds to the mystery, as [EventCharacter] moves silently.",
				'requirements': {}
			},
			'brookSerenity': {
				'text': "The [Descriptor] forest is peaceful at [TimeOfDay], especially near [Feature], where [Detail] complements the tranquility. You might encounter [EventCharacter].",
				'requirements': {}
			},
			'ancientSecrets': {
				'text': "The [Descriptor] forest seems timeless, especially as [TimeOfDay] unveils [Feature]. [Detail] and the presence of [EventCharacter] hint at ancient secrets.",
				'requirements': {}
			}
		}
	},
	'Mountain': {
		'descriptors': {
			'towering': { 'text': 'towering', 'requirements': {} },
			'rugged': { 'text': 'rugged', 'requirements': {} },
			'snowCapped': { 'text': 'snow-capped', 'requirements': {} },
			'majestic': { 'text': 'majestic', 'requirements': {} },
			'forbidding': { 'text': 'forbidding', 'requirements': {} }
		},
		'features': {
			'narrowLedge': { 'text': 'a narrow ledge', 'requirements': {} },
			'hiddenCave': { 'text': 'a hidden cave', 'requirements': {} },
			'ancientShrine': { 'text': 'an ancient shrine', 'requirements': {} },
			'cascadingWaterfall': { 'text': 'a cascading waterfall', 'requirements': {} },
			'steepCliff': { 'text': 'a steep cliff', 'requirements': {} }
		},
		'details': {
			'distantAvalanche': { 'text': 'the echo of a distant avalanche', 'requirements': {} },
			'valleyView': { 'text': 'a breathtaking view of the valley below', 'requirements': {} },
			'eaglesNest': { 'text': 'a nest of eagles', 'requirements': {} },
			'mountainGoats': { 'text': 'trails of mountain goats', 'requirements': {} },
			'thinAirChill': { 'text': 'the chill of the thin air', 'requirements': {} }
		},
		'timesOfDay': {
			'sunrise': { 'text': 'sunrise', 'requirements': {} },
			'midday': { 'text': 'midday', 'requirements': {} },
			'sunset': { 'text': 'sunset', 'requirements': {} },
			'clearNight': { 'text': 'a clear night', 'requirements': {} }
		},
		'statesOfTile': {
			'mistShrouded': { 'text': 'shrouded in mist', 'requirements': {} },
			'sunlit': { 'text': 'basking in sunlight', 'requirements': {} },
			'snowCovered': { 'text': 'covered in snow', 'requirements': {} },
			'cloudShadowed': { 'text': 'shadowed by clouds', 'requirements': {} }
		},
		'characters': {
			'climbersGroup': { 'text': 'a group of climbers', 'requirements': {} },
			'loneMonk': { 'text': 'a lone monk', 'requirements': {} },
			'snowLeopard': { 'text': 'an elusive snow leopard', 'requirements': {} },			
			'wanderingHermit': { 'text': 'a wandering hermit', 'requirements': {} },
		},
		'templates': {
			'peakAscent': {
				'text': "Ascending the [Descriptor] peak, you come across [Feature]. [Detail] surrounds you, and you might encounter [EventCharacter].",
				'requirements': {}
			},
			'hiddenRevelation': {
				'text': "In the [StateOfTile] mountains, [Feature] reveals itself. [Detail] catches your attention, as does the presence of [EventCharacter].",
				'requirements': {}
			},
			'solitudeHeight': {
				'text': "At the height of [TimeOfDay], the [Descriptor] mountains offer solitude. Here, [Feature] stands, and [Detail] accompanies the silence.",
				'requirements': {}
			},
			'nightWhispers': {
				'text': "Under the [TimeOfDay] skies, the [Descriptor] mountains whisper secrets. You find [Feature] and feel [Detail], possibly meeting [EventCharacter].",
				'requirements': {}
			}
		}
	},
	'River': {
		'descriptors': {
			'meandering': { 'text': 'meandering', 'requirements': {} },
			'tranquil': { 'text': 'tranquil', 'requirements': {} },
			'rapid': { 'text': 'rapid', 'requirements': {} },
			'frozen': { 'text': 'frozen', 'requirements': {} },
			'mighty': { 'text': 'mighty', 'requirements': {} }
		},
		'features': {
			'woodenBridge': { 'text': 'a wooden bridge', 'requirements': {} },
			'smallIsland': { 'text': 'a small island', 'requirements': {} },
			'rapids': { 'text': 'a series of rapids', 'requirements': {} },
			'oldMill': { 'text': 'an old mill', 'requirements': {} },
			'riverFork': { 'text': 'a fork in the river', 'requirements': {} }
		},
		'details': {
			'gentleFlow': { 'text': 'the gentle flow of water', 'requirements': {} },
			'fishSwimming': { 'text': 'fish swimming upstream', 'requirements': {} },
			'distantWaterfall': { 'text': 'the sound of a distant waterfall', 'requirements': {} },
			'frogsCroaking': { 'text': 'frogs croaking on the banks', 'requirements': {} },
			'driftwood': { 'text': 'driftwood floating downstream', 'requirements': {} }
		},
		'timesOfDay': {
			'dawn': { 'text': 'dawn', 'requirements': {} },
			'midday': { 'text': 'midday', 'requirements': {} },
			'dusk': { 'text': 'dusk', 'requirements': {} },
			'moonlitNight': { 'text': 'a moonlit night', 'requirements': {} }
		},
		'statesOfTile': {
			'overflowing': { 'text': 'overflowing from rain', 'requirements': {} },
			'dryTrickling': { 'text': 'dry and trickling', 'requirements': {} },
			'frozenIce': { 'text': 'frozen in ice', 'requirements': {} },
			'clearSparkling': { 'text': 'clear and sparkling', 'requirements': {} }
		},
		'characters': {
			'fisherman': { 'text': 'a fisherman casting a line', 'requirements': {} },
			'playingChildren': { 'text': 'children playing by the water', 'requirements': {} },
			'boatman': { 'text': 'a boatman ferrying passengers', 'requirements': {} },
			'wildlifeDrinking': { 'text': 'wildlife coming to drink', 'requirements': {} }
		},
		'templates': {
			'sereneFlow': {
				'text': "The [Descriptor] river flows [StateOfTile]. Along [Feature], you find [Detail] and may encounter [EventCharacter].",
				'requirements': {}
			},
			'mysticalWaters': {
				'text': "In the [StateOfTile] light, the [Descriptor] river reveals [Feature]. [Detail] enhances the scene, as [EventCharacter] appears.",
				'requirements': {}
			},
			'daytimeDiscovery': {
				'text': "During [TimeOfDay], the [Descriptor] river near [Feature] is a hub of activity. [Detail] resonates around, with [EventCharacter] in sight.",
				'requirements': {}
			},
			'nightReflections': {
				'text': "Under [TimeOfDay], the [Descriptor] river, flowing by [Feature], becomes a mirror. [Detail] fills the air, and you might see [EventCharacter].",
				'requirements': {}
			}
		}
	},
	'Desert': {
		'descriptors': {
			'vast': { 'text': 'vast', 'requirements': {} },
			'scorching': { 'text': 'scorching', 'requirements': {} },
			'barren': { 'text': 'barren', 'requirements': {} },
			'shifting': { 'text': 'shifting', 'requirements': {} },
			'mirageLaden': { 'text': 'mirage-laden', 'requirements': {} }
		},
		'features': {
			'sprawlingOasis': { 'text': 'a sprawling oasis', 'requirements': {} },
			'sunBleachedSkeleton': { 'text': 'a sun-bleached skeleton', 'requirements': {} },
			'ancientRuin': { 'text': 'an ancient ruin', 'requirements': {} },
			'duneSea': { 'text': 'a dune sea', 'requirements': {} },
			'hiddenSpring': { 'text': 'a hidden spring', 'requirements': {} }
		},
		'details': {
			'desertFoxTracks': { 'text': 'tracks of a desert fox', 'requirements': {} },
			'relentlessSun': { 'text': 'the relentless sun beating down', 'requirements': {} },
			'sandstorm': { 'text': 'a sudden sandstorm', 'requirements': {} },
			'coolNightAir': { 'text': 'the cool night air', 'requirements': {} },
			'desertFlower': { 'text': 'the rare bloom of a desert flower', 'requirements': {} }
		},
		'timesOfDay': {
			'dawn': { 'text': 'dawn', 'requirements': {} },
			'blisteringNoon': { 'text': 'the blistering noon', 'requirements': {} },
			'dusk': { 'text': 'dusk', 'requirements': {} },
			'starFilledNight': { 'text': 'a star-filled night', 'requirements': {} }
		},
		'statesOfTile': {
			'parchedDry': { 'text': 'parched and dry', 'requirements': {} },
			'mildTemperate': { 'text': 'mild and temperate', 'requirements': {} },
			'chillyWindy': { 'text': 'chilly and windy', 'requirements': {} },
			'sandstormShrouded': { 'text': 'shrouded in a sandstorm', 'requirements': {} }
		},
		'characters': {
			'tradersCaravan': { 'text': 'a caravan of traders', 'requirements': {} },
			'lostExplorer': { 'text': 'a lost explorer', 'requirements': {} },
			'nomadsGroup': { 'text': 'a group of nomads', 'requirements': {} },
			'desertCreature': { 'text': 'an elusive desert creature', 'requirements': {} }
		},
		'templates': {
			'oasisDiscovery': {
				'text': "In the [Descriptor] desert, [Feature] becomes a refuge. [Detail] reminds you of the desert's harshness, while [EventCharacter] shares tales.",
				'requirements': {}
			},
			'sandstormOrdeal': {
				'text': "The [Descriptor] desert's [Feature] becomes a challenge during [StateOfTile]. [Detail] is everywhere, and you might spot [EventCharacter].",
				'requirements': {}
			},
			'nocturnalSecrets': {
				'text': "Under [TimeOfDay], the [Descriptor] desert reveals [Feature]. The [Detail] is more pronounced, and you encounter [EventCharacter].",
				'requirements': {}
			},
			'sunlitMirages': {
				'text': "At [TimeOfDay], the [Descriptor] desert is a land of [Detail] and [Feature]. You might find [EventCharacter] amidst the mirages.",
				'requirements': {}
			}
		}
	},
	'Volcanic': {
		'descriptors': {
			'smoldering': { 'text': 'smoldering', 'requirements': {} },
			'erupting': { 'text': 'erupting', 'requirements': {} },
			'dormant': { 'text': 'dormant', 'requirements': {} },
			'rugged': { 'text': 'rugged', 'requirements': {} },
			'ashCovered': { 'text': 'ash-covered', 'requirements': {} }
		},
		'features': {
			'lavaFlow': { 'text': 'a lava flow', 'requirements': {} },
			'steamingCrater': { 'text': 'a steaming crater', 'requirements': {} },
			'sulfuricFumaroles': { 'text': 'sulfuric fumaroles', 'requirements': {} },
			'obsidianFormations': { 'text': 'obsidian formations', 'requirements': {} },
			'volcanicRockField': { 'text': 'a field of volcanic rock', 'requirements': {} }
		},
		'details': {
			'groundHeat': { 'text': 'the heat radiating from the ground', 'requirements': {} },
			'earthRumble': { 'text': 'the rumble of the earth', 'requirements': {} },
			'smokePlume': { 'text': 'a plume of smoke in the sky', 'requirements': {} },
			'sulfurSmell': { 'text': 'the acrid smell of sulfur', 'requirements': {} },
			'hotSprings': { 'text': 'pockets of hot springs', 'requirements': {} }
		},
		'timesOfDay': {
			'fieryDawn': { 'text': 'a fiery dawn', 'requirements': {} },
			'hazeFilledNoon': { 'text': 'a haze-filled noon', 'requirements': {} },
			'glowingDusk': { 'text': 'a glowing dusk', 'requirements': {} },
			'starlessNight': { 'text': 'a starless night', 'requirements': {} }
		},
		'statesOfTile': {
			'seismicActivity': { 'text': 'rumbling with seismic activity', 'requirements': {} },
			'eerieCalm': { 'text': 'quiet with eerie calm', 'requirements': {} },
			'ashFallout': { 'text': 'blanketed in ash fallout', 'requirements': {} },
			'newLandBirth': { 'text': 'giving birth to new land', 'requirements': {} }
		},
		'characters': {
			'geologistsTeam': { 'text': 'a team of geologists studying the terrain', 'requirements': {} },
			'adventurers': { 'text': 'adventurers navigating the hazards', 'requirements': {} },
			'adaptedWildlife': { 'text': 'wildlife adapted to the heat', 'requirements': {} },
			'isolatedHermit': { 'text': 'a hermit living in isolation', 'requirements': {} }
		},
		'templates': {
			'eruptionWitness': {
				'text': "Amidst the [Descriptor] landscape, [Feature] offers a thrilling spectacle. [Detail] is palpable, and [EventCharacter] shares insights.",
				'requirements': {}
			},
			'volcanicExploration': {
				'text': "Exploring the [Descriptor] terrain, you come across [Feature]. The [StateOfTile] conditions and [Detail] make it a unique experience, observed by [EventCharacter].",
				'requirements': {}
			},
			'smolderingDiscovery': {
				'text': "In the [Descriptor] [StateOfTile] area, [Feature] is a source of wonder. [Detail] adds to the ambiance, as [EventCharacter] investigates.",
				'requirements': {}
			},
			'nocturnalFires': {
				'text': "Under the [TimeOfDay], the [Descriptor] volcanic field and [Feature] glow ominously. [Detail] and the presence of [EventCharacter] add to the mystery.",
				'requirements': {}
			}
		}
	},
	'Mystical': {
		'descriptors': {
			'ethereal': { 'text': 'ethereal', 'requirements': {} },
			'otherworldly': { 'text': 'otherworldly', 'requirements': {} },
			'enchanted': { 'text': 'enchanted', 'requirements': {} },
			'arcane': { 'text': 'arcane', 'requirements': {} },
			'mystifying': { 'text': 'mystifying', 'requirements': {} }
		},
		'features': {
			'glowingPortal': { 'text': 'a glowing portal', 'requirements': {} },
			'ancientRunes': { 'text': 'ancient runes etched into the ground', 'requirements': {} },
			'floatingCrystal': { 'text': 'a floating crystal', 'requirements': {} },
			'luminescentTrees': { 'text': 'a grove of luminescent trees', 'requirements': {} },
			'whisperingStatues': { 'text': 'whispering statues', 'requirements': {} }
		},
		'details': {
			'magicalHum': { 'text': 'a faint magical hum', 'requirements': {} },
			'shimmeringAir': { 'text': 'shimmering air', 'requirements': {} },
			'strangeWhispers': { 'text': 'strange, unintelligible whispers', 'requirements': {} },
			'timelessness': { 'text': 'a sense of timelessness', 'requirements': {} },
			'unrealColors': { 'text': 'colors that seem unreal', 'requirements': {} }
		},
		'timesOfDay': {
			'timelessGlow': { 'text': 'a timeless glow', 'requirements': {} },
			'etherealLight': { 'text': 'a phase of ethereal light', 'requirements': {} },
			'shadowShift': { 'text': 'a shift of shadows', 'requirements': {} },
			'mysticMoon': { 'text': 'under a mystic moon', 'requirements': {} }
		},
		'statesOfTile': {
			'energyVibrating': { 'text': 'vibrating with energy', 'requirements': {} },
			'calmSerene': { 'text': 'calm and serene', 'requirements': {} },
			'magicalActivity': { 'text': 'alive with magical activity', 'requirements': {} },
			'stateOfFlux': { 'text': 'in a state of flux', 'requirements': {} }
		},
		'characters': {
			'wanderingSpirit': { 'text': 'a wandering spirit', 'requirements': {} },
			'crypticGuardian': { 'text': 'a cryptic guardian', 'requirements': {} },
			'ancientMage': { 'text': 'an ancient mage', 'requirements': {} },
			'unseenEntities': { 'text': 'forboding unseen entities', 'requirements': {} }
		},
		'templates': {
			'portalJourney': {
				'text': "The [Descriptor] environment pulsates around [Feature]. [Detail] fills the air, and [EventCharacter] might guide you.",
				'requirements': {}
			},
			'runesDiscovery': {
				'text': "Amidst the [StateOfTile] mystique, you encounter [Feature]. [Detail] suggests an ancient story, possibly revealed by [EventCharacter].",
				'requirements': {}
			},
			'crystalMystery': {
				'text': "The [Descriptor] [Feature] floats in the [StateOfTile] air. [Detail] and [EventCharacter] add to the enigma.",
				'requirements': {}
			},
			'moonlitRevelation': {
				'text': "Under the [TimeOfDay], the [Descriptor] surroundings are transformed. [Feature] glimmers, [Detail] whispers, and [EventCharacter] reveals secrets.",
				'requirements': {}
			}
		}
	},
	'Ruins': {
		'descriptors': {
			'ancient': { 'text': 'ancient', 'requirements': {} },
			'crumbling': { 'text': 'crumbling', 'requirements': {} },
			'forgotten': { 'text': 'forgotten', 'requirements': {} },
			'overgrown': { 'text': 'overgrown', 'requirements': {} }
		},
		'features': {
			'brokenColumns': { 'text': 'broken columns', 'requirements': {} },
			'collapsedRoof': { 'text': 'a collapsed roof', 'requirements': {} },
			'fadedFrescoes': { 'text': 'faded frescoes', 'requirements': {} },
			'overgrownCourtyard': { 'text': 'an overgrown courtyard', 'requirements': {} },
		},
		'details': {
			'echoesOfPast': { 'text': 'echoes of the past', 'requirements': {} },
			'oldLegends': { 'text': 'whispers of old legends', 'requirements': {} },
			'formerGlory': { 'text': 'the presence of former glory', 'requirements': {} },
			'entwiningVines': { 'text': 'vines entwining the walls', 'requirements': {} },
			'creviceShadows': { 'text': 'shadows playing in the crevices', 'requirements': {} }
		},
		'timesOfDay': {
			'earlyMorning': { 'text': 'the quiet of early morning', 'requirements': {} },
			'stillNoon': { 'text': 'the stillness of noon', 'requirements': {} },
			'lengtheningEvening': { 'text': 'the lengthening shadows of evening', 'requirements': {} },
			'eerieNight': { 'text': 'the eerie silence of night', 'requirements': {} }
		},
		'statesOfTile': {
			'reclaimedByNature': { 'text': 'partially reclaimed by nature', 'requirements': {} },
			'echoesOfHistory': { 'text': 'preserving echoes of history', 'requirements': {} },
			'defiantTime': { 'text': 'standing defiantly against time', 'requirements': {} },
			'shroudedMystery': { 'text': 'shrouded in mystery', 'requirements': {} }
		},
		'characters': {
			'historian': { 'text': 'a historian studying the walls', 'requirements': {} },
			'treasureHunter': { 'text': 'a treasure hunter searching for relics', 'requirements': {} },
			'ghostlyFigures': { 'text': 'ghostly figures of the past', 'requirements': {} },
			'wildlifeInhabitant': { 'text': 'wildlife making a home among the ruins', 'requirements': {} }
		},
		'templates': {
			'forgottenMemories': {
				'text': "Within the [Descriptor] ruins, [Feature] evokes [Detail]. The [TimeOfDay] adds to the atmosphere, with [EventCharacter] echoing the past.",
				'requirements': {}
			},
			'mysteryUncovered': {
				'text': "The [Descriptor] ruins, especially [Feature], hold many secrets. [Detail] under [TimeOfDay] light reveals clues, possibly uncovered by [EventCharacter].",
				'requirements': {}
			},
			'timelessEchoes': {
				'text': "In the [StateOfTile] ruins, [Feature] stands as a testament to [Detail]. [TimeOfDay] brings a serene moment, occasionally interrupted by [EventCharacter].",
				'requirements': {}
			},
			'shadowsOfHistory': {
				'text': "As [TimeOfDay] descends, the [Descriptor] ruins and their [Feature] become more enigmatic. [Detail] whispers tales, and [EventCharacter] may offer insights.",
				'requirements': {}
			}
		}
	}

}
const quests = {
	'mapQuestIntro': {
		'requirements': {
			'and' : {
				'characters': ['mysteriousHermit']
			},
			'not' : {
				'templates': ['mapMysteryUnveiled'] //prevent starting this chain if all forks have been completed
			}
		},
		'descriptors': {
			'hidden': { 'text': 'hidden', 'requirements': {} },
			'forgotten': { 'text': 'forgotten', 'requirements': {} },
		},
		'features': {
			'ancientMap': { 'text': 'an ancient map', 'requirements': { 'not' : { 'features': ['ancientMap'] } } }, //prevent finding these features twice
			'haveMap': { 'text': 'a reminder of your ancient map', 'requirements': { 'and' : { 'features': ['ancientMap']  } } }
		},
		'details': {
			'pastWhispers': { 'text': 'whispers of the past', 'requirements': {} },
			'echoingFootsteps': { 'text': 'echoing footsteps', 'requirements': {} },
			'torchGlow': { 'text': 'faint glow of torches', 'requirements': {} }
		},
		'timesOfDay': {
			'moonlitNight': { 'text': 'a moonlit night', 'requirements': {} },
			'dawnBreak': { 'text': 'the break of dawn', 'requirements': {} },
			'twilight': { 'text': 'twilight', 'requirements': {} }
		},
		'statesOfTile': {
			'mistCovered': { 'text': 'covered in mist', 'requirements': {} },
			'eerieLight': { 'text': 'bathed in eerie light', 'requirements': {} },
			'distantChants': { 'text': 'echoing with distant chants', 'requirements': {} }
		},
		'characters': {
			'ghostlyFigure': { 'text': 'a ghostly figure', 'requirements': {} },
			'wiseSage': { 'text': 'a wise sage', 'requirements': {} },
			'oldFriend': { 'text': 'an old friend', 'requirements': {} }
		},
		'templates': {
			'hermitQuest': {
				'text': "The hermit gives you [Feature].",
				'requirements': {
					'not' : { 'templates': ['hermitQuest']	}
				}
			},
		}
	},
	'mapQuestMiddle': {
		'requirements': {
			'conditionalStories': ['mapQuestIntro'] // Assuming player visited these tiles
		},
		'features': {
			'pathToRuins': { 'text': 'a Hidden Chamber in a region of Ruins', 'requirements': {'and' : { 'features': ['ancientMap'] }} },
		},
		'templates': {
			'ancientMapSecret': {
				'text': "The ancient map reveals a hidden path leading to [Feature].",
				'choices': [{ "feature": "Find [Feature]" }],
				'requirements': {
					'and' : { 'features': ['ancientMap']	},
					'not' : { 'templates': ['ancientMapSecret']	} //dont allow this quest twice
				}
			},
		}
	},
	'mapQuestEnd': {
		'requirements': {
			'and': {
				'conditionalStories': ['mapQuestMiddle'],
				'tiles': ['Ruins'],
				'features': ['ancientMap', 'hiddenChamber']
			}
		},
		'features': {
			'ancientTome': { 'text': 'an ancient tome', 'requirements': {'tiles': ['Ruins']} },
		},
		'templates': {
			'mapMysteryUnveiled': {
				'text': "Following the ancient map's trail, you uncover [Feature].",
				'choices': [{ "feature": "Read the ancient tome.", "completedText": "You have gained hidden ancient knowledge." }],
				'requirements': {
					'and' : { 'features': ['hiddenChamber', 'ancientMap'] },
					'not' : { 'templates': ['mapMysteryUnveiled']	} //dont allow this quest twice
				},
				'clearConditionalStories': ['mapQuestIntro','mapQuestMiddle','mapQuestEnd'] //reset quest chain on completion
			}
		}
	},

    'enchantedForestIntro': {
        'requirements': {
            'and': {
                'characters': ['mysteriousFawn']
            },
            'not': {
                'templates': ['enigmaOfTheElderTree']
            }
        },
        'features': {
            'glowingMushrooms': { 'text': 'glowing mushrooms', 'requirements': { 'and': { 'features': ['echoingMelody'] } } },
            'echoingMelody': { 'text': 'an echoing melody', 'requirements': { 'not': { 'features': ['echoingMelody'] } } }
        },
        'descriptors': {
			'timeless': { 'text': 'timeless', 'requirements': {'tiles': ['Mystical']} },
			'enlightened': { 'text': 'enlightened', 'requirements': {} }
		},
		'details': {
			'celestialAlignment': { 'text': 'celestial alignment', 'requirements': {'tiles': ['Mystical']} },
			'cosmicEnergy': { 'text': 'cosmic energy', 'requirements': {'tiles': ['Mystical']} },
			'theAnswer': { 'text': 'the answer', 'requirements': {} }
		},
		'timesOfDay': {
			'eternalTwilight': { 'text': 'eternal twilight', 'requirements': {} }
		},
		'statesOfTile': {
			'imbuedWithMagic': { 'text': 'imbued with magic', 'requirements': {} }
		},
		'characters': {
			'timelessSage': { 'text': 'a timeless sage', 'requirements': {} }
		},
        'templates': {
            'fawnGuidance': {
                'text': "The mysterious fawn leads you to [Feature].",
                'requirements': { 'not': { 'templates': ['fawnGuidance'] } }
            }
        }
    },
    'enchantedForestJourney': {
        'requirements': { 'conditionalStories': ['enchantedForestIntro'] },
        'features': {
            'pathOfWhispers': { 'text': 'the Path of Whispers', 'requirements': { 'and': { 'features': ['echoingMelody'] } } }
        },
        'templates': {
            'melodicPathDiscovery': {
                'text': "Following the [Feature], you uncover secrets of the forest.",
                'requirements': { 'and': { 'features': ['echoingMelody'] }, 'not': { 'templates': ['melodicPathDiscovery'] } }
            }
        }
    },
    'enchantedForestRevelation': {
        'requirements': {
            'and': {
                'conditionalStories': ['enchantedForestJourney'],
				'tiles': ['Forest'],
                'features': ['pathOfWhispers', 'echoingMelody']
            }
        },
        'features': {
            'elderTree': { 'text': 'the Elder Tree', 'requirements': {'tiles': ['Forest']} }
        },
        'templates': {
            'enigmaOfTheElderTree': {
                'text': "At the Elder Tree, ancient wisdom is revealed.",
                'requirements': { 'and': { 'features': ['pathOfWhispers', 'echoingMelody'] }, 'not': { 'templates': ['enigmaOfTheElderTree'] } },
                'clearConditionalStories': ['enchantedForestIntro', 'enchantedForestJourney', 'enchantedForestRevelation']
            }
        }
    },


    'ZephyraCityIntro': {
        'requirements': {
            'and': {
                'features': ['mysteriousAmulet']
            },
            'not': {
                'templates': ['ZephyraTreasureFound']
            }
        },
        'features': {
            'knownEntrance': { 'text': 'an entrance you recognize', 'requirements': { 'and': { 'features': ['hiddenEntrance'] } } },
            'hiddenEntrance': { 'text': 'a hidden entrance', 'requirements': { 'not': { 'features': ['hiddenEntrance'] } } }
        },
        'templates': {
            'cityGatesDiscovery': {
                'text': "The amulet leads you to [Feature].",
                'requirements': { 'not': { 'templates': ['cityGatesDiscovery'] } }
            }
        }
    },
    'ZephyraCityExploration': {
        'requirements': { 'conditionalStories': ['ZephyraCityIntro'] },
        'features': {
            'ancientLibrary': { 'text': 'an ancient library', 'requirements': { 'and': { 'features': ['hiddenEntrance'] } } }
        },
        'templates': {
            'librarySecrets': {
                'text': "[Feature] reveals the city's history and a clue to the treasure.",
                'requirements': { 'and': { 'features': ['hiddenEntrance'] }, 'not': { 'templates': ['librarySecrets'] } }
            }
        }
    },
    'ZephyraCityTreasure': {
        'requirements': {
            'and': {
                'conditionalStories': ['ZephyraCityExploration'],
				'tiles': ['Forest'],
                'features': ['hiddenEntrance', 'curiousRune']
            }
        },
        'features': {
            'ZephyraTreasure': { 'text': 'the treasure of Zephyra', 'requirements': {} }
        },
        'templates': {
            'ZephyraTreasureFound': {
                'text': "You uncover [Feature], the long-lost treasure of the city.",
                'requirements': { 'and': { 'features': ['hiddenEntrance', 'curiousRune'] }, 'not': { 'templates': ['ZephyraTreasureFound'] } },
                'clearConditionalStories': ['ZephyraCityIntro', 'ZephyraCityExploration', 'ZephyraCityTreasure']
            }
        }
    }

};
const questTriggers = {
	'mysteriousFawn': { 'tileType': 'Grassland', 'characters': { 'text': 'a mysterious fawn', 'requirements': { 'not' : { 'characters': ['mysteriousFawn'] } } } },	
	'elderTree': { 'tileType': 'Forest', 'features' : { 'text': 'the elder tree', 'requirements': {'conditionalStories': ['enchantedForestJourney']} } },
	'mysteriousAmulet': { 'tileType': 'Desert', 'features': { 'text': 'a mysterious amulet', 'requirements': { 'not' : { 'features': ['mysteriousAmulet'] } } } },	
	'hiddenChamber': { 'tileType': 'Ruins', 'features': {'text': 'a hidden chamber', 'requirements': { 'not' : { 'features': ['hiddenChamber'] } } } },
	'mysteriousHermit': { 'tileType': 'Mountain', 'characters': { 'text': 'a mysterious hermit', 'requirements': { 'not' : { 'characters': ['mysteriousHermit'] } } } },	
	'curiousRune': { 'tileType': 'Forest', 'features': {'text': 'a curious rune', 'requirements': { 'not' : { 'features': ['curiousRune'] } } } },
	
}
function injectQuestTriggers(content, triggers) {
    for (const [questKey, questDetails] of Object.entries(triggers)) {
        const { tileType } = questDetails;

        // Ensure the tile type exists in story content
        if (!content[tileType]) {
            console.warn(`Tile type '${tileType}' not found in story content.`);
            continue;
        }

        // Iterate over properties in questDetails (like character, feature, etc.)
        for (const prop in questDetails) {
            if (prop === 'tileType') continue; // Skip the tileType property

            if (!content[tileType][prop]) {
                console.warn(`Property '${prop}' not found in '${tileType}' tile type.`);
                continue;
            }
			console.log(tileType, prop, questKey, prop, questDetails[prop]);
            // Add the quest trigger to the corresponding property of the tile type
            content[tileType][prop][questKey] = questDetails[prop];
        }
    }
}



function initializeGame() {
	for(let i = 0; i < map_size; i++) {
		discoveredTiles[i] = [];
		map[i] = [];
		for(let j = 0; j < map_size; j++) {
			discoveredTiles[i][j] = false; // Initially, no tiles are discovered
			map[i][j] = '';
		}
	}


	// Call this function before exploring the map to create rivers
	generateRivers();
	map[current_position.y][current_position.x] = perimeter;
	discoverTile(current_position.x, current_position.y);
	// Call this function to explore the whole map
		for( let i = 1; i < perimeterSize + 3; i++ ) {
			explorePerimeter(i, true); // Outermost perimeter
		}
	current_position = start_pos;
	displayMap();
	injectQuestTriggers(storyContent, questTriggers);
	lookAround();
}
initializeGame();

//Story Generation
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}
function generateStory(tileType) {
	let progress = { tileType: tileType };
    updatePlayerProgress(progress);
	// Check for special stories
    const specialStory = checkForSpecialStories();
    if (specialStory) {
        return specialStory;
    }
	let tileContent = storyContent[tileType];
	return getStoryFromTileType(tileType, tileContent);
}
function getStoryFromTileType( tileType, content, storyKey="" ) {
	
	let validElements = getValidElementsFromStoryContent(content);
	
	let storyObject = {
		tileType: tileType,
		template: getRandomElement(validElements.templates),
		descriptor: getRandomElement(validElements.descriptors),
		feature: getRandomElement(validElements.features),
		detail: getRandomElement(validElements.details),
		character: getRandomElement(validElements.characters),
		timeOfDay: getRandomElement(validElements.timesOfDay),
		stateOfTile: getRandomElement(validElements.statesOfTile)
	}
	
	progress = { template: storyObject.template };
    updatePlayerProgress(progress);
	console.log("completed template", storyObject.template);
	if(content.templates[storyObject.template].clearConditionalStories){
		content.templates[storyObject.template].clearConditionalStories.forEach((sKey) => {
			console.log("removing", sKey);
			playerProgress.conditionalStories.delete(sKey)
		});
	}
	let story = generateStoryFromStoryObject( storyObject, content );
	let choices = generateChoicesFromStoryObject( storyObject, content, storyKey );

    return {
        "story": story,
        "choices": choices
    };
}
function getValidElementsFromStoryContent( content ) {
	return {
		templates: 	selectValidElements(content.templates),
		descriptors: selectValidElements(content.descriptors),
		features: selectValidElements(content.features),
		details: selectValidElements(content.details),
		characters: selectValidElements(content.characters),
		timesOfDay: selectValidElements(content.timesOfDay),
		statesOfTile: selectValidElements(content.statesOfTile)
	}	
}
function generateStoryFromStoryObject(storyObject, content) {
	let template = content.templates[storyObject.template];
	let story = template.text;
    // Replace placeholders with randomly selected elements
    story = story.replace('[TileType]', storyObject.tileType);
	if( storyObject.descriptor )
		story = story.replace('[Descriptor]', content.descriptors[storyObject.descriptor].text);
    if( storyObject.feature )
		story = story.replace('[Feature]', content.features[storyObject.feature].text);
    if( storyObject.detail )
		story = story.replace('[Detail]', content.details[storyObject.detail].text);
    if( storyObject.timeOfDay )
		story = story.replace('[TimeOfDay]', content.timesOfDay[storyObject.timeOfDay].text);
    if( storyObject.stateOfTile )
		story = story.replace('[StateOfTile]', content.statesOfTile[storyObject.stateOfTile].text);
    if( storyObject.character )
		story = story.replace('[EventCharacter]', content.characters[storyObject.character].text);
    
    return story;
}
function generateChoicesFromStoryObject(storyObject, content, storyKey) {	
	let template = content.templates[storyObject.template];
	let containsDetail = template.text.indexOf('[Detail]') > -1;
	let containsCharacter = template.text.indexOf('[EventCharacter]') > -1;
	let containsFeature = template.text.indexOf('[Feature]') > -1;
	
	let choices = [{ "text": `Explore ${storyObject.tileType}`, "target": "explore", "tileType": storyObject.tileType }];
	choices = [];
	if(containsCharacter) {
		//progress.character = storyObject.character;
		let choiceText = `Talk to ${content.characters[storyObject.character].text}`;
		if(template.choices) {
			template.choices.forEach((choice) => {
				if(choice.character) {
					choiceText = choice.character.replace(/\[EventCharacter\]/g, content.characters[storyObject.character].text);
					let choiceObj = { "text": choiceText, "storyKey": storyKey };
					if(choice.completedText){
						choiceObj.completedText = choice.completedText;
					}
					choices.push( choiceObj );
				}
			});
		} else {
			choices.push( { "text": choiceText, "target": "speak", "character": storyObject.character, "name": content.characters[storyObject.character].text, "storyKey": storyKey})
		}
	}	
	if(containsFeature) {
		//progress.feature = storyObject.feature;
		let choiceText = `Investigate ${content.features[storyObject.feature].text}`;
		if(template.choices) {
			template.choices.forEach((choice) => {
				if(choice.feature) {
				 	choiceText = choice.feature.replace(/\[Feature\]/g, content.features[storyObject.feature].text);
					let choiceObj = { "text": choiceText, "storyKey": storyKey };
					if(choice.completedText){
						choiceObj.completedText = choice.completedText;
					}
					choices.push( choiceObj );	          
				}
			});
		} else {
			choices.push( { "text": choiceText, "target": "investigate", "feature": storyObject.feature, "name": content.features[storyObject.feature].text, "storyKey": storyKey })		          
		}
	}
	if(containsDetail) {
		//progress.detail = storyObject.detail;
		let choiceText = `Focus on ${content.details[storyObject.detail].text}`;
		if(template.choices) {
			template.choices.forEach((choice) => {
				if(choice.detail) {
					choiceText = choice.detail.replace(/\[Detail\]/g, content.details[storyObject.detail].text);
					let choiceObj = { "text": choiceText, "storyKey": storyKey };
					if(choice.completedText){
						choiceObj.completedText = choice.completedText;
					}
					choices.push( choiceObj );
				}
			});
		} else {
			choices.push( { "text": choiceText, "target": "focus", "detail": storyObject.detail, "name": content.details[storyObject.detail].text, "storyKey": storyKey })		          
		}
	}
    return choices;
}
function selectValidElements(elements) {
	if(!elements) return {};
    let validElements = Object.keys(elements).filter(key => checkRequirements(elements[key].requirements));
    return validElements;
}
function checkForSpecialStories() {

	for (const [storyKey, storyInfo] of Object.entries(quests)) {
		if (playerProgress.conditionalStories.has(storyKey)) continue; // Skip if already encountered
		
		const meetsQuestConditions = checkRequirements(storyInfo.requirements);
		if( meetsQuestConditions ) {
			for (const [templateKey, templateInfo] of Object.entries(storyInfo.templates)) {
				if (playerProgress.templates.has(templateKey)) continue; // Skip if already encountered
				const meetsRequirements = checkRequirements(templateInfo.requirements);
				if (meetsRequirements) {
					updatePlayerProgress({ conditionalStory: storyKey });
					return getStoryFromTileType(currentTileType, storyInfo, storyKey);
				}
			}
		}
	}
    return null; // No special story conditions met
}
function checkRequirements(requirements) {
    const meetsAndConditions = (requirements.and || (!requirements.not && !requirements.or)) ? Object.entries(requirements.and || requirements).every(([key, value]) => {
        if (Array.isArray(value)) {
            return value.every(item => playerProgress[key].has(item));
        }
        return playerProgress[key] && playerProgress[key].has(value);
    }) : true;

    const meetsOrConditions = requirements.or ? requirements.or.some(condition => {
        return Object.entries(condition).every(([key, value]) => {
			if (Array.isArray(value)) {
				return value.every(item => playerProgress[key].has(item));
			}
			return playerProgress[key].has(value);
        });
    }) : true; // true if no OR conditions are present

	const meetsNotConditions = requirements.not ? Object.entries(requirements.not).every(([key, values]) => {
        if (Array.isArray(values)) {
            return !values.every(value => playerProgress[key].has(value));
        } else {
            return !playerProgress[key].has(values);
        }
    }) : true; // true if no NOT conditions are present or they are all met

    return meetsAndConditions && meetsOrConditions && meetsNotConditions;
}
function updatePlayerProgress(progress) {
    if (progress.tileType) playerProgress.tiles.add(progress.tileType);
    if (progress.feature) playerProgress.features.add(progress.feature);
    if (progress.detail) playerProgress.details.add(progress.detail);
    if (progress.character) playerProgress.characters.add(progress.character);
    if (progress.template) playerProgress.templates.add(progress.template);
	if (progress.stateOfTile) playerProgress.statesOfTile.add(progress.stateOfTile);
	if (progress.timeOfDay) playerProgress.timesOfDay.add(progress.timeOfDay);
	if (progress.conditionalStory) playerProgress.conditionalStories.add(progress.conditionalStory);
}
function determineNextStoryStep() {
    if (!playerProgress.currentConditionalStory) {
        return null;
    }

    const story = conditionalStoryContent[playerProgress.currentConditionalStory];
    const nextSteps = Object.entries(story.templates).filter(([key, template]) => {
        return checkRequirements(template.requirements) && !playerProgress.templates.has(key);
    });

    return nextSteps.length > 0 ? nextSteps[0] : null;
}

// Utility Functions
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function isValidPosition(position) {
    return position.x >= 0 && position.x < map_size && position.y >= 0 && position.y < map_size;
}
function getNeighborPosition(position, direction) {
    switch (direction) {
        case 'North': return { x: position.x, y: position.y - 1 };
        case 'South': return { x: position.x, y: position.y + 1 };
        case 'East': return { x: position.x + 1, y: position.y };
        case 'West': return { x: position.x - 1, y: position.y };
        default: return { ...position };
    }
}
function isEdgePosition(position) {
    return position.x <= perimeterSize - 1 || position.x >= map_size - perimeterSize || position.y <= perimeterSize - 1 || position.y >= map_size - perimeterSize;
}
function refresh() {
	location.href = location.href;
}

// Map Generation
function chooseRiverMouths() {
    // Array representing the four edges
    const edges = ['North', 'South', 'East', 'West'];
    
    // Randomly select an edge to exclude
    const excludeEdgeIndex = getRandomInt(0, edges.length - 1);
    edges.splice(excludeEdgeIndex, 1); // Remove the selected edge

    // Initialize an empty array for river mouths
    const riverMouths = [];

    // Generate river mouths on the remaining three edges
    edges.forEach(edge => {
        switch (edge) {
            case 'North':
                riverMouths.push({ x: getRandomInt(1, map_size - 2), y: 0 });
                break;
            case 'South':
                riverMouths.push({ x: getRandomInt(1, map_size - 2), y: map_size - 1 });
                break;
            case 'East':
                riverMouths.push({ x: map_size - 1, y: getRandomInt(1, map_size - 2) });
                break;
            case 'West':
                riverMouths.push({ x: 0, y: getRandomInt(1, map_size - 2) });
                break;
        }
    });

    return riverMouths;
}
function generateRiverFromMouth(riverMouth) {
    let currentX = riverMouth.x;
    let currentY = riverMouth.y;
    let riverLength = 0; // Initialize river length
    let prevDirection = riverMouth.y === 0 ? 'South' : 
                       riverMouth.y === map_size - 1 ? 'North' : 
                       riverMouth.x === 0 ? 'East' : 'West';

    while (true) {
        if (shouldEndRiver(riverLength)) {
            // Place a mountain or end the river based on your game rules
            map[currentY][currentX] = 'Mountain';
            break;
        } else {
			if(isEdgePosition({x: currentX, y: currentY})) {
				map[currentY][currentX] = 'Ocean';
			} else {
				map[currentY][currentX] = 'River';
			}
        }

        let nextTile = getNextRiverTile(currentX, currentY, prevDirection);
		if( nextTile == null ) {
            map[currentY][currentX] = 'Mountain';
			break;
		}
        prevDirection = nextTile.direction;

        if (!isValidPosition({x: nextTile.x, y: nextTile.y}) || map[nextTile.y][nextTile.x] !== '') {
            break;
        }

        currentX = nextTile.x;
        currentY = nextTile.y;
        riverLength++; // Increment the length of the river with each new tile
    }
}
function getNextRiverTile(x, y, prevDirection) {
    const centerX = Math.floor(map_size / 2);
    const centerY = Math.floor(map_size / 2);
    let dx = centerX - x;
    let dy = centerY - y;

    // Normalize the differences to get movement probabilities
    let totalDiff = Math.abs(dx) + Math.abs(dy);
    let probEast = dx > 0 ? Math.abs(dx) / totalDiff : 0;
    let probWest = dx < 0 ? Math.abs(dx) / totalDiff : 0;
    let probSouth = dy > 0 ? Math.abs(dy) / totalDiff : 0;
    let probNorth = dy < 0 ? Math.abs(dy) / totalDiff : 0;

    // Decide the next direction based on probabilities
    let directionRoll = Math.random();
    let direction;

    if (directionRoll < probNorth) {
        direction = 'North';
    } else if (directionRoll < probNorth + probSouth) {
        direction = 'South';
    } else if (directionRoll < probNorth + probSouth + probEast) {
        direction = 'East';
    } else {
        direction = 'West';
    }

    // Get the next position based on the chosen direction
    let nextX = x + (direction === 'East' ? 1 : direction === 'West' ? -1 : 0);
    let nextY = y + (direction === 'North' ? -1 : direction === 'South' ? 1 : 0);

    // Ensure the next position is valid before returning
    if (isValidPosition({ x: nextX, y: nextY })) {
        return { x: nextX, y: nextY, direction: direction };
    } else {
        // Return null or a default value if the next position is not valid
        return null;
    }
}
function shouldEndRiver(riverLength) {
    const minRiverLength = Math.floor(map_size * 0.45);

    // Do not end the river if it hasn't reached the minimum length
    if (riverLength < minRiverLength) {
        return false;
    }

    // Define the maximum potential river length (half of the map size could represent the center of the map)
    const maxRiverLength = map_size / 2;
    // Calculate the chance of the river ending based on its current length
    let chance = Math.pow((riverLength - minRiverLength) / (maxRiverLength - minRiverLength), 2);

    // Ensure there's always a slight chance to end sooner for variability
    chance = Math.max(chance, 0.05);
    
    // Cap the chance at a value that ensures it almost certainly ends before the center
    chance = Math.min(chance, 0.95);

    // Determine if the river should end
    return Math.random() < chance;
}
function generateRivers() {
    let riverMouths = chooseRiverMouths();
    riverMouths.forEach(mouth => {
        generateRiverFromMouth(mouth);
    });
}

// User Interface and Rendering
function displayMap() {
    const mapDiv = document.getElementById('map');
    mapDiv.innerHTML = '';

    map.forEach((row, y) => {
        const rowDiv = document.createElement('div');
        row.forEach((tile, x) => {
            const tileDiv = document.createElement('div');
            tileDiv.classList.add('tile');
			if(x==current_position.x && y==current_position.y) {
				tileDiv.classList.add('current_tile');
			}
            // Only add class if the tile has been discovered
            if (discoveredTiles[y][x]) {
                if (tile != "") {
                    tileDiv.classList.add(tile);
                }
            }
            rowDiv.appendChild(tileDiv);
        });
        mapDiv.appendChild(rowDiv);
    });
}
function announce(message) {
	document.getElementById('story').innerText = message;
}
function clearStory() {
	const storyElement = document.getElementById('story');
    const choicesElement = document.getElementById('choices');

    storyElement.textContent = '';
    choicesElement.innerHTML = '';
}
function renderStory(storyObject) {
    const storyElement = document.getElementById('story');
    const choicesElement = document.getElementById('choices');

    storyElement.textContent = storyObject.story;
    choicesElement.innerHTML = '';

    // Render choices specific to the story object
    storyObject.choices.forEach(choice => {
        const button = document.createElement('button');
        button.textContent = choice.text;
        button.className = 'btn active';
        button.onclick = () => {
			choicesElement.innerHTML = '';
			if(choice.completedText){
				announce(choice.completedText);
				return;
			} 
            if(choice.character) { 
                speakToCharacter(choice.character, choice.name);
            } else if(choice.detail) {
                focusOnDetail(choice.detail, choice.name);
            } else if(choice.feature) {
                investigateFeature(choice.feature, choice.name);
            } else if(choice.explore) {
                exploreTileType(choice.tileType, choice.tileType);
            }
        };
        choicesElement.appendChild(button);
    });
}
function lookAround(skipStory=false) {
	if(skipStory) return;
    currentTileType = map[current_position.y][current_position.x];
    renderStory(generateStory(currentTileType));
}
function displayNextStepRequirements() {
    const nextStep = determineNextStoryStep();
    if (!nextStep) {
        console.log("No next step available or story completed.");
        return;
    }

    const [templateKey, templateInfo] = nextStep;
    console.log(`Next step: ${templateKey}`);
    console.log("Requirements:");

    Object.entries(templateInfo.requirements).forEach(([key, req]) => {
        if (Array.isArray(req)) {
            console.log(`- ${key}: ${req.join(", ")}`);
        } else {
            console.log(`- ${key}: ${req}`);
        }
    });
}

//Exploration
function speakToCharacter(key, name) {
	updatePlayerProgress({ character: key });
	const specialStory = checkForSpecialStories();
    if (specialStory) {
        renderStory(specialStory);
    } else {
		announce(`You spoke to ${name}`);
	}
}
function focusOnDetail(key, name) {
	updatePlayerProgress({ detail: key });
	const specialStory = checkForSpecialStories();
	if (specialStory) {
        renderStory(specialStory);
    } else {
		announce(`You focused on ${name}`);
	}
}
function investigateFeature(key, name) {
	updatePlayerProgress({ feature: key });
	const specialStory = checkForSpecialStories();
	if (specialStory) {
        renderStory(specialStory);
    } else {
		announce(`You investigated ${name}`);
	}
}
function discoverTile(x, y) {
    discoveredTiles[y][x] = true;
	clearStory();
}
function exploreTile(x, y, skipOptions=false) {
    discoverTile(x, y);
    current_position = { x: x, y: y }; // Update current position
    if (map[y][x] === '') {
        if (isEdgePosition({ x, y })) {
            map[y][x] = perimeter;
            lookAround(skipOptions);
        } else {
            let options = getOptionsBasedOnNeighbors(x, y);
            if (options.length === 0) {
                map[y][x] = 'River'; // Default to 'River' if no options
            } else {
                presentOptionsToPlayer(options, x, y, skipOptions);
            }
        }
    } else {
		lookAround(skipOptions);
    }
	if(!skipOptions){
		displayMap();
	}
}
function getOptionsBasedOnNeighbors(x, y) {
    const directions = ['North', 'South', 'East', 'West'];
    let validTypes = new Set(tileTypes); // Start with all tile types as valid

    // Exclude 'River' from valid types
    validTypes.delete('River');

    directions.forEach(direction => {
        let neighborPos = getNeighborPosition({ x, y }, direction);

        if (isValidPosition(neighborPos)) {
            let neighborType = map[neighborPos.y][neighborPos.x];
            if (!neighborType && isEdgePosition(neighborPos)) {
                neighborType = perimeter;
            }
            if (terrainWeights[neighborType]) {
                let currentTypes = new Set(Object.keys(terrainWeights[neighborType]));
                // Keep only types that are present and have a weight greater than 0 in the current neighbor
                validTypes = new Set([...validTypes].filter(type => currentTypes.has(type) && terrainWeights[neighborType][type] > 0));
            } 
        }
    });

    // If no valid types are found (unlikely), default to a random type (excluding River)
    if (validTypes.size === 0) {
        let typesWithoutRiver = tileTypes.filter(type => type !== 'River');
        return [typesWithoutRiver[Math.floor(Math.random() * typesWithoutRiver.length)]];
    }

    // Accumulate weights for valid types
    let neighborWeights = {};
    validTypes.forEach(type => {
        neighborWeights[type] = 0;
        directions.forEach(direction => {
            let neighborPos = getNeighborPosition({ x, y }, direction);
            if (isValidPosition(neighborPos)) {
                let neighborType = map[neighborPos.y][neighborPos.x];
                if (neighborType && terrainWeights[neighborType] && terrainWeights[neighborType][type]) {
                    neighborWeights[type] += terrainWeights[neighborType][type];
                }
            }
        });
    });
    // Convert the accumulated weights into an array of options and proceed as before
    let weightedOptions = [];
    Object.keys(neighborWeights).forEach(type => {
        if (neighborWeights[type] > 0) {
            for (let i = 0; i < neighborWeights[type]; i++) {
                weightedOptions.push(type);
            }
        }
    });
    // Shuffle the weightedOptions to randomize their order
    for (let i = weightedOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [weightedOptions[i], weightedOptions[j]] = [weightedOptions[j], weightedOptions[i]]; // Swap elements
    }
    // Randomly pick up to 3 unique options
    let chosenOptions = [];
    while (chosenOptions.length < 3 && weightedOptions.length > 0) {
        let optionIndex = Math.floor(Math.random() * weightedOptions.length);
        let option = weightedOptions.splice(optionIndex, 1)[0];
        if (!chosenOptions.includes(option)) {
            chosenOptions.push(option);
        }
    }

    return chosenOptions;
}
function presentOptionsToPlayer(options, x, y, skipOptions=false) {
	
	if( skipOptions) {
		map[y][x] = options[0]; // Set the chosen terrain type
		state = 'explore';
		return;	
	}
	
	[...document.getElementsByClassName('directionBtn')].forEach((btn) => { btn.classList.remove('active') });
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = 'What do you see here?'; // Clear previous options
	announce('');
    options.forEach(option => {
        const button = document.createElement('button');
        button.innerText = option;
        button.classList.add('typeBtn');
        button.classList.add('btn');
        button.classList.add('active');
        button.onclick = function() {
            map[y][x] = option; // Set the chosen terrain type
            displayMap(); // Update the map display
            optionsContainer.innerHTML = ''; // Clear the options
			
			lookAround();
			[...document.getElementsByClassName('directionBtn')].forEach((btn) => { btn.classList.add('active') });	
			state = 'explore';
        };
        optionsContainer.appendChild(button);
    });
		
	state = 'discover';
}
function exploreDirection(direction) {
	if( state == 'explore'){
		let newPosition = getNeighborPosition(current_position, direction);
		if (isValidPosition(newPosition)) {
			exploreTile(newPosition.x, newPosition.y);	
		} else {			
			announce('Invalid position');			
		}
	}
}
function explorePerimeter(perimeterLevel, skipOptions=false) {
    // Define the start and end points for the loop based on perimeter level
    let start = perimeterLevel - 1;
    let end = map_size - perimeterLevel;
    
    // Explore the top and bottom rows
    for (let x = start; x <= end; x++) {
        exploreTile(x, start, skipOptions); // Top row
        exploreTile(x, end, skipOptions); // Bottom row
    }
    // Explore the left and right columns
    for (let y = start; y <= end; y++) {
        exploreTile(start, y, skipOptions); // Left column
        exploreTile(end, y, skipOptions); // Right column
    }
}
function exploreWholeMap() {
	var tempPosition = {x: current_position.x, y: current_position.y};
    // Explore a 2-tile perimeter
	for( let i = 1; i < perimeterSize + 5; i++ ) {
		explorePerimeter(i, true); // Outermost perimeter
    }
    // Now explore the rest of the map
    for (let y = 2; y < map_size - 2; y++) {
        for (let x = 2; x < map_size - 2; x++) {
            exploreTile(x, y, true);
        }
    }
	current_position = tempPosition;
	exploreTile(current_position.x, current_position.y, true);
	displayMap();		
}
