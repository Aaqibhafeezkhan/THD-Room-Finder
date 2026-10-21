-- Study tables (M2, issue #131, ADR 0007): a free room, a time and a few
-- seats, shared by a word link such as mossy-lagoon-42. Replies are a seat
-- or a maybe; Can't removes the reply.
-- Same boundary as the focus service: private tables with RLS and no
-- policies; every client call is a SECURITY DEFINER function that takes the
-- user from auth.uid(). Reading a table by its link needs no account.

-- Two lists of 512 short plain words: a describing word, then a thing.
create table focus.link_word (
  list smallint not null check (list in (1, 2)),
  idx smallint not null check (idx between 0 and 511),
  word text not null check (word ~ '^[a-z]{3,9}$'),
  primary key (list, idx),
  unique (list, word)
);
alter table focus.link_word enable row level security;

insert into focus.link_word (list, idx, word) values
  (1, 0, 'amber'), (1, 1, 'azure'), (1, 2, 'brisk'), (1, 3, 'bold'),
  (1, 4, 'brave'), (1, 5, 'bright'), (1, 6, 'breezy'), (1, 7, 'calm'),
  (1, 8, 'candid'), (1, 9, 'cheery'), (1, 10, 'chilly'), (1, 11, 'clever'),
  (1, 12, 'cloudy'), (1, 13, 'cosy'), (1, 14, 'crisp'), (1, 15, 'curly'),
  (1, 16, 'dainty'), (1, 17, 'dapper'), (1, 18, 'dewy'), (1, 19, 'dusky'),
  (1, 20, 'dusty'), (1, 21, 'eager'), (1, 22, 'early'), (1, 23, 'easy'),
  (1, 24, 'elfin'), (1, 25, 'fair'), (1, 26, 'fancy'), (1, 27, 'fast'),
  (1, 28, 'festive'), (1, 29, 'fine'), (1, 30, 'firm'), (1, 31, 'fluffy'),
  (1, 32, 'fond'), (1, 33, 'foggy'), (1, 34, 'frank'), (1, 35, 'free'),
  (1, 36, 'fresh'), (1, 37, 'frosty'), (1, 38, 'fuzzy'), (1, 39, 'gentle'),
  (1, 40, 'glad'), (1, 41, 'gleaming'), (1, 42, 'glossy'), (1, 43, 'golden'),
  (1, 44, 'grand'), (1, 45, 'grassy'), (1, 46, 'great'), (1, 47, 'green'),
  (1, 48, 'happy'), (1, 49, 'hardy'), (1, 50, 'hazy'), (1, 51, 'hearty'),
  (1, 52, 'honest'), (1, 53, 'hopeful'), (1, 54, 'humble'), (1, 55, 'icy'),
  (1, 56, 'jolly'), (1, 57, 'jumpy'), (1, 58, 'keen'), (1, 59, 'kind'),
  (1, 60, 'lanky'), (1, 61, 'leafy'), (1, 62, 'lemon'), (1, 63, 'light'),
  (1, 64, 'lilac'), (1, 65, 'limber'), (1, 66, 'little'), (1, 67, 'lively'),
  (1, 68, 'lofty'), (1, 69, 'loyal'), (1, 70, 'lucky'), (1, 71, 'lunar'),
  (1, 72, 'mellow'), (1, 73, 'merry'), (1, 74, 'mighty'), (1, 75, 'mild'),
  (1, 76, 'minty'), (1, 77, 'misty'), (1, 78, 'modest'), (1, 79, 'mossy'),
  (1, 80, 'muddy'), (1, 81, 'narrow'), (1, 82, 'neat'), (1, 83, 'nimble'),
  (1, 84, 'noble'), (1, 85, 'nutty'), (1, 86, 'oaken'), (1, 87, 'olive'),
  (1, 88, 'open'), (1, 89, 'orange'), (1, 90, 'pale'), (1, 91, 'peaceful'),
  (1, 92, 'peppy'), (1, 93, 'perky'), (1, 94, 'pink'), (1, 95, 'plain'),
  (1, 96, 'plucky'), (1, 97, 'plush'), (1, 98, 'polite'), (1, 99, 'proud'),
  (1, 100, 'quick'), (1, 101, 'quiet'), (1, 102, 'rainy'), (1, 103, 'rapid'),
  (1, 104, 'ready'), (1, 105, 'rosy'), (1, 106, 'round'), (1, 107, 'royal'),
  (1, 108, 'ruby'), (1, 109, 'rustic'), (1, 110, 'rusty'), (1, 111, 'sandy'),
  (1, 112, 'shady'), (1, 113, 'sharp'), (1, 114, 'shiny'),
  (1, 115, 'silent'), (1, 116, 'silky'), (1, 117, 'silver'),
  (1, 118, 'simple'), (1, 119, 'sleek'), (1, 120, 'sleepy'),
  (1, 121, 'slim'), (1, 122, 'smart'), (1, 123, 'smooth'), (1, 124, 'snowy'),
  (1, 125, 'snug'), (1, 126, 'soft'), (1, 127, 'solar'), (1, 128, 'sonic'),
  (1, 129, 'spicy'), (1, 130, 'spry'), (1, 131, 'steady'), (1, 132, 'stony'),
  (1, 133, 'stormy'), (1, 134, 'sturdy'), (1, 135, 'sunny'),
  (1, 136, 'super'), (1, 137, 'sweet'), (1, 138, 'swift'), (1, 139, 'tall'),
  (1, 140, 'tame'), (1, 141, 'tawny'), (1, 142, 'teal'), (1, 143, 'tender'),
  (1, 144, 'tidy'), (1, 145, 'tiny'), (1, 146, 'tranquil'),
  (1, 147, 'tricky'), (1, 148, 'true'), (1, 149, 'trusty'),
  (1, 150, 'upbeat'), (1, 151, 'vast'), (1, 152, 'velvet'),
  (1, 153, 'violet'), (1, 154, 'vivid'), (1, 155, 'warm'), (1, 156, 'wavy'),
  (1, 157, 'wild'), (1, 158, 'windy'), (1, 159, 'wise'), (1, 160, 'witty'),
  (1, 161, 'woolly'), (1, 162, 'young'), (1, 163, 'zesty'),
  (1, 164, 'zippy'), (1, 165, 'acorn'), (1, 166, 'alder'), (1, 167, 'apple'),
  (1, 168, 'aspen'), (1, 169, 'autumn'), (1, 170, 'bamboo'),
  (1, 171, 'basil'), (1, 172, 'beech'), (1, 173, 'berry'), (1, 174, 'birch'),
  (1, 175, 'blossom'), (1, 176, 'bramble'), (1, 177, 'briar'),
  (1, 178, 'cactus'), (1, 179, 'cedar'), (1, 180, 'cherry'),
  (1, 181, 'chestnut'), (1, 182, 'cider'), (1, 183, 'citrus'),
  (1, 184, 'clover'), (1, 185, 'cocoa'), (1, 186, 'coral'),
  (1, 187, 'cotton'), (1, 188, 'cypress'), (1, 189, 'daisy'),
  (1, 190, 'dune'), (1, 191, 'elder'), (1, 192, 'elm'), (1, 193, 'fennel'),
  (1, 194, 'fern'), (1, 195, 'fig'), (1, 196, 'flax'), (1, 197, 'ginger'),
  (1, 198, 'hazel'), (1, 199, 'heather'), (1, 200, 'holly'),
  (1, 201, 'honey'), (1, 202, 'ivory'), (1, 203, 'ivy'), (1, 204, 'jade'),
  (1, 205, 'jasmine'), (1, 206, 'juniper'), (1, 207, 'kelp'),
  (1, 208, 'lava'), (1, 209, 'lavender'), (1, 210, 'linen'),
  (1, 211, 'lotus'), (1, 212, 'maple'), (1, 213, 'marble'),
  (1, 214, 'meadow'), (1, 215, 'melon'), (1, 216, 'mint'), (1, 217, 'mocha'),
  (1, 218, 'moss'), (1, 219, 'nectar'), (1, 220, 'nutmeg'), (1, 221, 'oak'),
  (1, 222, 'oat'), (1, 223, 'onyx'), (1, 224, 'opal'), (1, 225, 'orchid'),
  (1, 226, 'paper'), (1, 227, 'pearl'), (1, 228, 'pebble'),
  (1, 229, 'pepper'), (1, 230, 'pine'), (1, 231, 'plum'), (1, 232, 'poppy'),
  (1, 233, 'quartz'), (1, 234, 'reed'), (1, 235, 'rose'),
  (1, 236, 'saffron'), (1, 237, 'sage'), (1, 238, 'satin'),
  (1, 239, 'sesame'), (1, 240, 'slate'), (1, 241, 'spruce'),
  (1, 242, 'straw'), (1, 243, 'tulip'), (1, 244, 'tundra'),
  (1, 245, 'walnut'), (1, 246, 'willow'), (1, 247, 'wool'),
  (1, 248, 'arctic'), (1, 249, 'alpine'), (1, 250, 'coastal'),
  (1, 251, 'cosmic'), (1, 252, 'crystal'), (1, 253, 'desert'),
  (1, 254, 'distant'), (1, 255, 'evening'), (1, 256, 'frozen'),
  (1, 257, 'garden'), (1, 258, 'harbor'), (1, 259, 'hidden'),
  (1, 260, 'island'), (1, 261, 'jungle'), (1, 262, 'lake'),
  (1, 263, 'marsh'), (1, 264, 'midnight'), (1, 265, 'morning'),
  (1, 266, 'mountain'), (1, 267, 'north'), (1, 268, 'ocean'),
  (1, 269, 'orbit'), (1, 270, 'polar'), (1, 271, 'prairie'),
  (1, 272, 'river'), (1, 273, 'rocky'), (1, 274, 'shore'), (1, 275, 'sky'),
  (1, 276, 'south'), (1, 277, 'spring'), (1, 278, 'summer'),
  (1, 279, 'thunder'), (1, 280, 'tidal'), (1, 281, 'timber'),
  (1, 282, 'valley'), (1, 283, 'winter'), (1, 284, 'woodland'),
  (1, 285, 'copper'), (1, 286, 'bronze'), (1, 287, 'cobalt'),
  (1, 288, 'crimson'), (1, 289, 'indigo'), (1, 290, 'magenta'),
  (1, 291, 'scarlet'), (1, 292, 'cream'), (1, 293, 'peach'),
  (1, 294, 'mango'), (1, 295, 'lime'), (1, 296, 'navy'), (1, 297, 'sepia'),
  (1, 298, 'umber'), (1, 299, 'ochre'), (1, 300, 'russet'),
  (1, 301, 'beige'), (1, 302, 'cyan'), (1, 303, 'agile'), (1, 304, 'ample'),
  (1, 305, 'artful'), (1, 306, 'atomic'), (1, 307, 'balmy'),
  (1, 308, 'blithe'), (1, 309, 'bouncy'), (1, 310, 'brainy'),
  (1, 311, 'bubbly'), (1, 312, 'bumpy'), (1, 313, 'busy'),
  (1, 314, 'buttery'), (1, 315, 'chirpy'), (1, 316, 'chunky'),
  (1, 317, 'classic'), (1, 318, 'cozy'), (1, 319, 'crafty'),
  (1, 320, 'creamy'), (1, 321, 'cuddly'), (1, 322, 'cute'),
  (1, 323, 'daring'), (1, 324, 'deft'), (1, 325, 'dreamy'),
  (1, 326, 'elegant'), (1, 327, 'epic'), (1, 328, 'fabled'),
  (1, 329, 'famous'), (1, 330, 'fearless'), (1, 331, 'feisty'),
  (1, 332, 'fiery'), (1, 333, 'fleet'), (1, 334, 'flowing'),
  (1, 335, 'fluent'), (1, 336, 'folksy'), (1, 337, 'fragrant'),
  (1, 338, 'friendly'), (1, 339, 'frisky'), (1, 340, 'funky'),
  (1, 341, 'gallant'), (1, 342, 'gifted'), (1, 343, 'glassy'),
  (1, 344, 'glowing'), (1, 345, 'graceful'), (1, 346, 'grateful'),
  (1, 347, 'gusty'), (1, 348, 'handy'), (1, 349, 'harmonic'),
  (1, 350, 'heroic'), (1, 351, 'hilly'), (1, 352, 'hollow'),
  (1, 353, 'homely'), (1, 354, 'hushed'), (1, 355, 'ideal'),
  (1, 356, 'jaunty'), (1, 357, 'jazzy'), (1, 358, 'jovial'),
  (1, 359, 'joyful'), (1, 360, 'juicy'), (1, 361, 'kindly'),
  (1, 362, 'kingly'), (1, 363, 'knotty'), (1, 364, 'lavish'),
  (1, 365, 'lean'), (1, 366, 'lilting'), (1, 367, 'limpid'),
  (1, 368, 'lithe'), (1, 369, 'lush'), (1, 370, 'magic'), (1, 371, 'metal'),
  (1, 372, 'mindful'), (1, 373, 'mirthy'), (1, 374, 'moody'),
  (1, 375, 'moonlit'), (1, 376, 'musical'), (1, 377, 'mystic'),
  (1, 378, 'native'), (1, 379, 'nautical'), (1, 380, 'nifty'),
  (1, 381, 'nordic'), (1, 382, 'novel'), (1, 383, 'oceanic'),
  (1, 384, 'organic'), (1, 385, 'pastel'), (1, 386, 'patient'),
  (1, 387, 'perfect'), (1, 388, 'petite'), (1, 389, 'pixel'),
  (1, 390, 'placid'), (1, 391, 'playful'), (1, 392, 'pleasant'),
  (1, 393, 'plump'), (1, 394, 'poetic'), (1, 395, 'polished'),
  (1, 396, 'pretty'), (1, 397, 'pristine'), (1, 398, 'prompt'),
  (1, 399, 'pure'), (1, 400, 'quaint'), (1, 401, 'quirky'),
  (1, 402, 'radiant'), (1, 403, 'rare'), (1, 404, 'regal'),
  (1, 405, 'relaxed'), (1, 406, 'restful'), (1, 407, 'rich'),
  (1, 408, 'ripe'), (1, 409, 'roomy'), (1, 410, 'rugged'), (1, 411, 'rural'),
  (1, 412, 'salty'), (1, 413, 'savvy'), (1, 414, 'scenic'),
  (1, 415, 'secret'), (1, 416, 'serene'), (1, 417, 'shy'), (1, 418, 'silly'),
  (1, 419, 'sincere'), (1, 420, 'social'), (1, 421, 'solid'),
  (1, 422, 'sound'), (1, 423, 'sparkly'), (1, 424, 'speedy'),
  (1, 425, 'spirited'), (1, 426, 'spotted'), (1, 427, 'starry'),
  (1, 428, 'stellar'), (1, 429, 'sterling'), (1, 430, 'still'),
  (1, 431, 'striped'), (1, 432, 'strong'), (1, 433, 'sublime'),
  (1, 434, 'subtle'), (1, 435, 'sugary'), (1, 436, 'sunlit'),
  (1, 437, 'supple'), (1, 438, 'sure'), (1, 439, 'tangy'), (1, 440, 'tasty'),
  (1, 441, 'thrifty'), (1, 442, 'timely'), (1, 443, 'tough'),
  (1, 444, 'tropic'), (1, 445, 'twinkly'), (1, 446, 'unique'),
  (1, 447, 'urban'), (1, 448, 'valiant'), (1, 449, 'vernal'),
  (1, 450, 'vital'), (1, 451, 'volcanic'), (1, 452, 'wandering'),
  (1, 453, 'wholesome'), (1, 454, 'wiry'), (1, 455, 'worthy'),
  (1, 456, 'yummy'), (1, 457, 'zany'), (1, 458, 'zen'), (1, 459, 'crunchy'),
  (1, 460, 'dappled'), (1, 461, 'flinty'), (1, 462, 'frothy'),
  (1, 463, 'gilded'), (1, 464, 'kooky'), (1, 465, 'lucid'),
  (1, 466, 'luminous'), (1, 467, 'obsidian'), (1, 468, 'pebbly'),
  (1, 469, 'piney'), (1, 470, 'rippled'), (1, 471, 'rolling'),
  (1, 472, 'shimmery'), (1, 473, 'spangled'), (1, 474, 'speckled'),
  (1, 475, 'springy'), (1, 476, 'sprightly'), (1, 477, 'sunburnt'),
  (1, 478, 'tinted'), (1, 479, 'toasty'), (1, 480, 'velvety'),
  (1, 481, 'verdant'), (1, 482, 'wintry'), (1, 483, 'woody'),
  (1, 484, 'balsam'), (1, 485, 'cinder'), (1, 486, 'ember'),
  (1, 487, 'flint'), (1, 488, 'garnet'), (1, 489, 'granite'),
  (1, 490, 'hickory'), (1, 491, 'iris'), (1, 492, 'jasper'),
  (1, 493, 'kiwi'), (1, 494, 'lagoon'), (1, 495, 'loam'), (1, 496, 'maize'),
  (1, 497, 'mulberry'), (1, 498, 'pewter'), (1, 499, 'poplar'),
  (1, 500, 'quill'), (1, 501, 'rain'), (1, 502, 'raven'), (1, 503, 'rowan'),
  (1, 504, 'sable'), (1, 505, 'seashell'), (1, 506, 'sienna'),
  (1, 507, 'sorrel'), (1, 508, 'sparrow'), (1, 509, 'sumac'),
  (1, 510, 'thistle'), (1, 511, 'thyme'),
  (2, 0, 'lagoon'), (2, 1, 'harbor'), (2, 2, 'meadow'), (2, 3, 'river'),
  (2, 4, 'canyon'), (2, 5, 'valley'), (2, 6, 'summit'), (2, 7, 'island'),
  (2, 8, 'glacier'), (2, 9, 'forest'), (2, 10, 'orchard'), (2, 11, 'garden'),
  (2, 12, 'prairie'), (2, 13, 'desert'), (2, 14, 'tundra'), (2, 15, 'marsh'),
  (2, 16, 'delta'), (2, 17, 'bayou'), (2, 18, 'cove'), (2, 19, 'creek'),
  (2, 20, 'brook'), (2, 21, 'spring'), (2, 22, 'pond'), (2, 23, 'lake'),
  (2, 24, 'ocean'), (2, 25, 'shore'), (2, 26, 'beach'), (2, 27, 'dune'),
  (2, 28, 'reef'), (2, 29, 'cliff'), (2, 30, 'ridge'), (2, 31, 'peak'),
  (2, 32, 'hill'), (2, 33, 'knoll'), (2, 34, 'mesa'), (2, 35, 'butte'),
  (2, 36, 'crater'), (2, 37, 'geyser'), (2, 38, 'volcano'),
  (2, 39, 'cavern'), (2, 40, 'grotto'), (2, 41, 'hollow'), (2, 42, 'glen'),
  (2, 43, 'dale'), (2, 44, 'field'), (2, 45, 'pasture'), (2, 46, 'grove'),
  (2, 47, 'thicket'), (2, 48, 'jungle'), (2, 49, 'oasis'), (2, 50, 'fjord'),
  (2, 51, 'inlet'), (2, 52, 'strait'), (2, 53, 'channel'), (2, 54, 'rapids'),
  (2, 55, 'falls'), (2, 56, 'cascade'), (2, 57, 'mirror'),
  (2, 58, 'lantern'), (2, 59, 'beacon'), (2, 60, 'compass'),
  (2, 61, 'anchor'), (2, 62, 'sail'), (2, 63, 'paddle'), (2, 64, 'oar'),
  (2, 65, 'raft'), (2, 66, 'canoe'), (2, 67, 'kayak'), (2, 68, 'ferry'),
  (2, 69, 'dock'), (2, 70, 'pier'), (2, 71, 'wharf'), (2, 72, 'tower'),
  (2, 73, 'castle'), (2, 74, 'bridge'), (2, 75, 'arch'), (2, 76, 'gate'),
  (2, 77, 'cottage'), (2, 78, 'cabin'), (2, 79, 'chalet'), (2, 80, 'barn'),
  (2, 81, 'mill'), (2, 82, 'forge'), (2, 83, 'studio'), (2, 84, 'library'),
  (2, 85, 'atrium'), (2, 86, 'plaza'), (2, 87, 'market'), (2, 88, 'bazaar'),
  (2, 89, 'otter'), (2, 90, 'badger'), (2, 91, 'beaver'), (2, 92, 'falcon'),
  (2, 93, 'heron'), (2, 94, 'robin'), (2, 95, 'sparrow'), (2, 96, 'finch'),
  (2, 97, 'wren'), (2, 98, 'owl'), (2, 99, 'hawk'), (2, 100, 'eagle'),
  (2, 101, 'raven'), (2, 102, 'crane'), (2, 103, 'stork'), (2, 104, 'swan'),
  (2, 105, 'goose'), (2, 106, 'duck'), (2, 107, 'puffin'),
  (2, 108, 'penguin'), (2, 109, 'pelican'), (2, 110, 'parrot'),
  (2, 111, 'toucan'), (2, 112, 'gecko'), (2, 113, 'lizard'),
  (2, 114, 'turtle'), (2, 115, 'tortoise'), (2, 116, 'frog'),
  (2, 117, 'toad'), (2, 118, 'salmon'), (2, 119, 'trout'), (2, 120, 'tuna'),
  (2, 121, 'marlin'), (2, 122, 'dolphin'), (2, 123, 'whale'),
  (2, 124, 'seal'), (2, 125, 'walrus'), (2, 126, 'narwhal'),
  (2, 127, 'octopus'), (2, 128, 'squid'), (2, 129, 'crab'),
  (2, 130, 'lobster'), (2, 131, 'shrimp'), (2, 132, 'oyster'),
  (2, 133, 'clam'), (2, 134, 'snail'), (2, 135, 'koala'), (2, 136, 'panda'),
  (2, 137, 'lemur'), (2, 138, 'sloth'), (2, 139, 'llama'),
  (2, 140, 'alpaca'), (2, 141, 'bison'), (2, 142, 'moose'), (2, 143, 'elk'),
  (2, 144, 'deer'), (2, 145, 'fawn'), (2, 146, 'fox'), (2, 147, 'wolf'),
  (2, 148, 'lynx'), (2, 149, 'puma'), (2, 150, 'tiger'), (2, 151, 'lion'),
  (2, 152, 'zebra'), (2, 153, 'giraffe'), (2, 154, 'hippo'),
  (2, 155, 'rhino'), (2, 156, 'camel'), (2, 157, 'yak'), (2, 158, 'ibex'),
  (2, 159, 'goat'), (2, 160, 'lamb'), (2, 161, 'pony'), (2, 162, 'horse'),
  (2, 163, 'mule'), (2, 164, 'donkey'), (2, 165, 'rabbit'), (2, 166, 'hare'),
  (2, 167, 'hedgehog'), (2, 168, 'mole'), (2, 169, 'vole'),
  (2, 170, 'shrew'), (2, 171, 'mouse'), (2, 172, 'hamster'),
  (2, 173, 'ferret'), (2, 174, 'mink'), (2, 175, 'weasel'),
  (2, 176, 'marten'), (2, 177, 'raccoon'), (2, 178, 'possum'),
  (2, 179, 'skunk'), (2, 180, 'squirrel'), (2, 181, 'chipmunk'),
  (2, 182, 'bat'), (2, 183, 'bee'), (2, 184, 'wasp'), (2, 185, 'moth'),
  (2, 186, 'beetle'), (2, 187, 'cricket'), (2, 188, 'firefly'),
  (2, 189, 'ladybug'), (2, 190, 'dragonfly'), (2, 191, 'acorn'),
  (2, 192, 'almond'), (2, 193, 'apple'), (2, 194, 'apricot'),
  (2, 195, 'banana'), (2, 196, 'berry'), (2, 197, 'biscuit'),
  (2, 198, 'bagel'), (2, 199, 'bun'), (2, 200, 'cake'), (2, 201, 'candy'),
  (2, 202, 'carrot'), (2, 203, 'cashew'), (2, 204, 'cherry'),
  (2, 205, 'chestnut'), (2, 206, 'cocoa'), (2, 207, 'coconut'),
  (2, 208, 'cookie'), (2, 209, 'cracker'), (2, 210, 'cupcake'),
  (2, 211, 'date'), (2, 212, 'dumpling'), (2, 213, 'fig'), (2, 214, 'grape'),
  (2, 215, 'guava'), (2, 216, 'hazelnut'), (2, 217, 'honey'),
  (2, 218, 'jam'), (2, 219, 'kiwi'), (2, 220, 'lemon'), (2, 221, 'lime'),
  (2, 222, 'mango'), (2, 223, 'maple'), (2, 224, 'melon'),
  (2, 225, 'muffin'), (2, 226, 'noodle'), (2, 227, 'nutmeg'),
  (2, 228, 'olive'), (2, 229, 'orange'), (2, 230, 'papaya'),
  (2, 231, 'peach'), (2, 232, 'peanut'), (2, 233, 'pear'), (2, 234, 'pecan'),
  (2, 235, 'pepper'), (2, 236, 'pickle'), (2, 237, 'pie'),
  (2, 238, 'pistachio'), (2, 239, 'plum'), (2, 240, 'pretzel'),
  (2, 241, 'pudding'), (2, 242, 'pumpkin'), (2, 243, 'quince'),
  (2, 244, 'radish'), (2, 245, 'raisin'), (2, 246, 'raspberry'),
  (2, 247, 'rhubarb'), (2, 248, 'sesame'), (2, 249, 'sorbet'),
  (2, 250, 'taco'), (2, 251, 'toffee'), (2, 252, 'tomato'),
  (2, 253, 'truffle'), (2, 254, 'turnip'), (2, 255, 'waffle'),
  (2, 256, 'walnut'), (2, 257, 'yam'), (2, 258, 'anvil'), (2, 259, 'arrow'),
  (2, 260, 'badge'), (2, 261, 'banner'), (2, 262, 'barrel'),
  (2, 263, 'basket'), (2, 264, 'bell'), (2, 265, 'bench'),
  (2, 266, 'blanket'), (2, 267, 'bottle'), (2, 268, 'bucket'),
  (2, 269, 'button'), (2, 270, 'cable'), (2, 271, 'candle'),
  (2, 272, 'canvas'), (2, 273, 'carpet'), (2, 274, 'chair'),
  (2, 275, 'chalk'), (2, 276, 'clock'), (2, 277, 'cloud'), (2, 278, 'comet'),
  (2, 279, 'crayon'), (2, 280, 'crown'), (2, 281, 'cushion'),
  (2, 282, 'desk'), (2, 283, 'drum'), (2, 284, 'easel'), (2, 285, 'engine'),
  (2, 286, 'feather'), (2, 287, 'fiddle'), (2, 288, 'flag'),
  (2, 289, 'flute'), (2, 290, 'fountain'), (2, 291, 'frame'),
  (2, 292, 'gadget'), (2, 293, 'globe'), (2, 294, 'guitar'),
  (2, 295, 'hammer'), (2, 296, 'hammock'), (2, 297, 'helmet'),
  (2, 298, 'jacket'), (2, 299, 'kettle'), (2, 300, 'kite'),
  (2, 301, 'ladder'), (2, 302, 'lamp'), (2, 303, 'locket'),
  (2, 304, 'magnet'), (2, 305, 'map'), (2, 306, 'marble'), (2, 307, 'medal'),
  (2, 308, 'mitten'), (2, 309, 'needle'), (2, 310, 'notebook'),
  (2, 311, 'orbit'), (2, 312, 'palette'), (2, 313, 'parcel'),
  (2, 314, 'pencil'), (2, 315, 'piano'), (2, 316, 'pillow'),
  (2, 317, 'pocket'), (2, 318, 'postcard'), (2, 319, 'quill'),
  (2, 320, 'quilt'), (2, 321, 'radio'), (2, 322, 'ribbon'),
  (2, 323, 'rocket'), (2, 324, 'saddle'), (2, 325, 'satchel'),
  (2, 326, 'scarf'), (2, 327, 'scroll'), (2, 328, 'shovel'),
  (2, 329, 'sketch'), (2, 330, 'sled'), (2, 331, 'spoon'), (2, 332, 'stamp'),
  (2, 333, 'stool'), (2, 334, 'string'), (2, 335, 'sweater'),
  (2, 336, 'table'), (2, 337, 'teapot'), (2, 338, 'ticket'),
  (2, 339, 'timber'), (2, 340, 'torch'), (2, 341, 'trumpet'),
  (2, 342, 'tunnel'), (2, 343, 'umbrella'), (2, 344, 'vase'),
  (2, 345, 'violin'), (2, 346, 'wagon'), (2, 347, 'wallet'),
  (2, 348, 'whistle'), (2, 349, 'window'), (2, 350, 'yoyo'),
  (2, 351, 'zipper'), (2, 352, 'aurora'), (2, 353, 'breeze'),
  (2, 354, 'dawn'), (2, 355, 'dusk'), (2, 356, 'eclipse'), (2, 357, 'ember'),
  (2, 358, 'flame'), (2, 359, 'frost'), (2, 360, 'galaxy'), (2, 361, 'glow'),
  (2, 362, 'gust'), (2, 363, 'hail'), (2, 364, 'halo'), (2, 365, 'horizon'),
  (2, 366, 'meteor'), (2, 367, 'mist'), (2, 368, 'moon'), (2, 369, 'nebula'),
  (2, 370, 'planet'), (2, 371, 'pulsar'), (2, 372, 'rain'),
  (2, 373, 'rainbow'), (2, 374, 'shadow'), (2, 375, 'spark'),
  (2, 376, 'star'), (2, 377, 'storm'), (2, 378, 'sun'), (2, 379, 'sunrise'),
  (2, 380, 'sunset'), (2, 381, 'thunder'), (2, 382, 'twilight'),
  (2, 383, 'wind'), (2, 384, 'zephyr'), (2, 385, 'quasar'),
  (2, 386, 'cosmos'), (2, 387, 'bloom'), (2, 388, 'blossom'),
  (2, 389, 'bud'), (2, 390, 'clover'), (2, 391, 'daisy'), (2, 392, 'fern'),
  (2, 393, 'flower'), (2, 394, 'ivy'), (2, 395, 'lily'), (2, 396, 'lotus'),
  (2, 397, 'moss'), (2, 398, 'orchid'), (2, 399, 'petal'), (2, 400, 'pine'),
  (2, 401, 'poppy'), (2, 402, 'reed'), (2, 403, 'rose'), (2, 404, 'sprout'),
  (2, 405, 'thistle'), (2, 406, 'tulip'), (2, 407, 'violet'),
  (2, 408, 'willow'), (2, 409, 'aspen'), (2, 410, 'birch'),
  (2, 411, 'cedar'), (2, 412, 'cypress'), (2, 413, 'elm'),
  (2, 414, 'hemlock'), (2, 415, 'juniper'), (2, 416, 'larch'),
  (2, 417, 'linden'), (2, 418, 'magnolia'), (2, 419, 'oak'),
  (2, 420, 'poplar'), (2, 421, 'redwood'), (2, 422, 'sequoia'),
  (2, 423, 'spruce'), (2, 424, 'sycamore'), (2, 425, 'yew'),
  (2, 426, 'bamboo'), (2, 427, 'cactus'), (2, 428, 'pixel'),
  (2, 429, 'rhythm'), (2, 430, 'melody'), (2, 431, 'chord'),
  (2, 432, 'sonnet'), (2, 433, 'poem'), (2, 434, 'story'),
  (2, 435, 'riddle'), (2, 436, 'puzzle'), (2, 437, 'fable'),
  (2, 438, 'legend'), (2, 439, 'saga'), (2, 440, 'ballad'),
  (2, 441, 'anthem'), (2, 442, 'whisper'), (2, 443, 'giggle'),
  (2, 444, 'chuckle'), (2, 445, 'smile'), (2, 446, 'wink'),
  (2, 447, 'nudge'), (2, 448, 'hello'), (2, 449, 'hooray'),
  (2, 450, 'bravo'), (2, 451, 'cheers'), (2, 452, 'voyage'),
  (2, 453, 'journey'), (2, 454, 'quest'), (2, 455, 'trek'),
  (2, 456, 'ramble'), (2, 457, 'stroll'), (2, 458, 'wander'),
  (2, 459, 'picnic'), (2, 460, 'festival'), (2, 461, 'parade'),
  (2, 462, 'carnival'), (2, 463, 'fiesta'), (2, 464, 'jubilee'),
  (2, 465, 'gala'), (2, 466, 'atlas'), (2, 467, 'blimp'),
  (2, 468, 'boulder'), (2, 469, 'burrow'), (2, 470, 'caravan'),
  (2, 471, 'carousel'), (2, 472, 'chapel'), (2, 473, 'citadel'),
  (2, 474, 'courtyard'), (2, 475, 'crossing'), (2, 476, 'dingo'),
  (2, 477, 'dory'), (2, 478, 'emu'), (2, 479, 'gazebo'), (2, 480, 'gondola'),
  (2, 481, 'hamlet'), (2, 482, 'harp'), (2, 483, 'heath'),
  (2, 484, 'hideout'), (2, 485, 'iceberg'), (2, 486, 'igloo'),
  (2, 487, 'jetty'), (2, 488, 'koi'), (2, 489, 'lane'), (2, 490, 'lodge'),
  (2, 491, 'loft'), (2, 492, 'marina'), (2, 493, 'meerkat'),
  (2, 494, 'minnow'), (2, 495, 'nook'), (2, 496, 'outpost'),
  (2, 497, 'pagoda'), (2, 498, 'pathway'), (2, 499, 'pavilion'),
  (2, 500, 'pebble'), (2, 501, 'quarry'), (2, 502, 'ravine'),
  (2, 503, 'sandbar'), (2, 504, 'sanctum'), (2, 505, 'shelter'),
  (2, 506, 'skiff'), (2, 507, 'spire'), (2, 508, 'steppe'),
  (2, 509, 'stream'), (2, 510, 'terrace'), (2, 511, 'tram');

create table focus.study_table (
  id uuid primary key default gen_random_uuid(),
  link text not null unique check (link ~ '^[a-z]{3,9}-[a-z]{3,9}-[1-9][0-9]$'),
  host uuid not null references auth.users (id) on delete cascade,
  topic text check (topic is null or char_length(btrim(topic)) between 1 and 40),
  room_key text not null references focus.room (room_key),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  seats smallint not null check (seats in (1, 2, 4, 6, 8, 12)),
  focus_minutes smallint not null check (focus_minutes between 5 and 120),
  break_minutes smallint not null check (break_minutes between 0 and 30),
  long_break_minutes smallint not null default 0 check (long_break_minutes between 0 and 30),
  long_every smallint not null default 0 check (long_every between 0 and 8),
  host_show_name boolean not null default false,
  cancelled_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_table_length check (ends_at >= starts_at + interval '25 minutes' and ends_at <= starts_at + interval '3 hours')
);
create index study_table_host_idx on focus.study_table (host, starts_at);
create index study_table_cleanup_idx on focus.study_table (ends_at);

create table focus.table_reply (
  table_id uuid not null references focus.study_table (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  answer text not null check (answer in ('seat', 'maybe')),
  show_name boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (table_id, user_id)
);
create index table_reply_user_idx on focus.table_reply (user_id);

alter table focus.study_table enable row level security;
alter table focus.table_reply enable row level security;

-- ── Internal helpers ────────────────────────────────────────────────────

-- A free word link: describing word, thing, two digits (about 23 million).
create function focus.new_table_link() returns text
language plpgsql volatile set search_path = '' as $$
declare
  bytes bytea;
  candidate text;
begin
  for attempt in 1..20 loop
    bytes := uuid_send(gen_random_uuid());
    candidate :=
      (select w.word from focus.link_word w where w.list = 1
         and w.idx = ((get_byte(bytes, 0) << 8) | get_byte(bytes, 1)) % 512)
      || '-' ||
      (select w.word from focus.link_word w where w.list = 2
         and w.idx = ((get_byte(bytes, 2) << 8) | get_byte(bytes, 3)) % 512)
      || '-' || (10 + get_byte(bytes, 4) % 90)::text;
    if not exists (select 1 from focus.study_table t where t.link = candidate) then
      return candidate;
    end if;
  end loop;
  raise exception 'no free table link' using errcode = '55000', hint = 'link_exhausted';
end $$;

-- A table the caller may see: exists, and ended less than 24 hours ago.
-- Links are matched in lower case with spaces trimmed, as people type them.
create function focus.find_table(p_link text) returns focus.study_table
language sql stable set search_path = '' as $$
  select t.* from focus.study_table t
   where t.link = lower(btrim(p_link)) and t.ends_at > now() - interval '24 hours'
$$;

create function focus.require_identity(p_user uuid) returns void
language plpgsql stable set search_path = '' as $$
begin
  if not exists (select 1 from focus.identity i where i.user_id = p_user) then
    raise exception 'study profile required' using errcode = '22023', hint = 'needs_profile';
  end if;
end $$;

-- Names of people who chose to show them, for one answer.
create function focus.reply_names(p_table uuid, p_answer text) returns jsonb
language sql stable set search_path = '' as $$
  select coalesce(jsonb_agg(i.display_name order by r.updated_at), '[]'::jsonb)
    from focus.table_reply r
    join focus.identity i on i.user_id = r.user_id
   where r.table_id = p_table and r.answer = p_answer and r.show_name and i.display_name is not null
$$;

-- Seats taken, the host's included.
create function focus.seats_taken(p_table uuid) returns integer
language sql stable set search_path = '' as $$
  select 1 + count(*)::integer from focus.table_reply r where r.table_id = p_table and r.answer = 'seat'
$$;

create function focus.table_json(t focus.study_table, p_viewer uuid) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'link', t.link,
    'topic', t.topic,
    'room_key', t.room_key,
    'room_code', (select r.code from focus.room r where r.room_key = t.room_key),
    'starts_at', t.starts_at,
    'ends_at', t.ends_at,
    'seats', t.seats,
    'rhythm', jsonb_build_object(
      'focus_minutes', t.focus_minutes,
      'break_minutes', t.break_minutes,
      'long_break_minutes', t.long_break_minutes,
      'long_every', t.long_every),
    'host_name', case when t.host_show_name
      then (select i.display_name from focus.identity i where i.user_id = t.host) end,
    'host_show_name', t.host_show_name,
    'cancelled', t.cancelled_at is not null,
    'changed', t.version > 1,
    'version', t.version,
    'is_host', p_viewer is not null and t.host = p_viewer,
    'my_answer', (select r.answer from focus.table_reply r where r.table_id = t.id and r.user_id = p_viewer),
    'my_show_name', (select r.show_name from focus.table_reply r where r.table_id = t.id and r.user_id = p_viewer),
    'taken', focus.seats_taken(t.id),
    'maybe', (select count(*) from focus.table_reply r where r.table_id = t.id and r.answer = 'maybe'),
    'seat_names', focus.reply_names(t.id, 'seat'),
    'maybe_names', focus.reply_names(t.id, 'maybe'),
    'server_now', now()
  )
$$;

create function focus.check_table_input(
  p_topic text, p_room_key text, p_starts_at timestamptz, p_minutes integer, p_seats integer,
  p_focus_minutes integer, p_break_minutes integer
) returns void
language plpgsql stable set search_path = '' as $$
begin
  if p_starts_at is null or p_starts_at < now() - interval '5 minutes' then
    raise exception 'table starts in the past' using errcode = '22023', hint = 'invalid_time';
  end if;
  if p_starts_at > now() + interval '14 days' then
    raise exception 'table is too far ahead' using errcode = '22023', hint = 'invalid_time';
  end if;
  if p_minutes is null or p_minutes < 25 or p_minutes > 180 then
    raise exception 'table length out of range' using errcode = '22023', hint = 'invalid_length';
  end if;
  if p_seats is null or p_seats not in (1, 2, 4, 6, 8, 12) then
    raise exception 'seats must be 1, 2, 4, 6, 8 or 12' using errcode = '22023', hint = 'invalid_seats';
  end if;
  if p_focus_minutes is null or p_focus_minutes not between 5 and 120
     or p_break_minutes is null or p_break_minutes not between 0 and 30 then
    raise exception 'invalid rhythm' using errcode = '22023', hint = 'invalid_rhythm';
  end if;
  if p_topic is not null and char_length(btrim(p_topic)) > 40 then
    raise exception 'topic too long' using errcode = '22023', hint = 'invalid_topic';
  end if;
  if p_room_key is null or not exists (
    select 1 from focus.room r where r.room_key = p_room_key and r.active
  ) then
    raise exception 'unknown room' using errcode = '22023', hint = 'unknown_room';
  end if;
end $$;

revoke all on function
  focus.new_table_link(), focus.find_table(text), focus.require_identity(uuid),
  focus.reply_names(uuid, text), focus.seats_taken(uuid), focus.table_json(focus.study_table, uuid),
  focus.check_table_input(text, text, timestamptz, integer, integer, integer, integer)
from public, anon, authenticated;

-- ── Client API ──────────────────────────────────────────────────────────

create function public.set_table(
  p_topic text,
  p_room_key text,
  p_starts_at timestamptz,
  p_minutes integer,
  p_seats integer,
  p_focus_minutes integer,
  p_break_minutes integer,
  p_long_break_minutes integer default 0,
  p_long_every integer default 0,
  p_show_name boolean default false
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := focus.require_user();
  saved focus.study_table;
begin
  perform focus.require_identity(uid);
  perform focus.check_table_input(p_topic, p_room_key, p_starts_at, p_minutes, p_seats, p_focus_minutes, p_break_minutes);
  if (select count(*) from focus.study_table t
       where t.host = uid and t.ends_at > now() and t.cancelled_at is null) >= 5 then
    raise exception 'too many upcoming tables' using errcode = '22023', hint = 'table_limit';
  end if;
  insert into focus.study_table (link, host, topic, room_key, starts_at, ends_at, seats,
                                 focus_minutes, break_minutes, long_break_minutes, long_every, host_show_name)
  values (focus.new_table_link(), uid, nullif(btrim(p_topic), ''), p_room_key, p_starts_at,
          p_starts_at + make_interval(mins => p_minutes), p_seats,
          p_focus_minutes, p_break_minutes, coalesce(p_long_break_minutes, 0), coalesce(p_long_every, 0),
          coalesce(p_show_name, false))
  returning * into saved;
  return focus.table_json(saved, uid);
end $$;

-- Host only. A change bumps the version, so guests see "Changed". Seats can
-- shrink only down to the seats already taken.
create function public.change_table(
  p_link text,
  p_expected_version integer,
  p_topic text,
  p_room_key text,
  p_starts_at timestamptz,
  p_minutes integer,
  p_seats integer,
  p_focus_minutes integer,
  p_break_minutes integer,
  p_long_break_minutes integer default 0,
  p_long_every integer default 0,
  p_show_name boolean default false
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := focus.require_user();
  cur focus.study_table := focus.find_table(p_link);
  saved focus.study_table;
begin
  if cur.id is null or cur.host <> uid then
    raise exception 'table not found' using errcode = 'P0002', hint = 'not_found';
  end if;
  if cur.cancelled_at is not null or cur.ends_at <= now() then
    raise exception 'table is closed' using errcode = '22023', hint = 'table_closed';
  end if;
  if cur.version <> p_expected_version then
    raise exception 'table changed elsewhere' using errcode = 'PT409', hint = 'stale_version';
  end if;
  perform focus.check_table_input(p_topic, p_room_key, p_starts_at, p_minutes, p_seats, p_focus_minutes, p_break_minutes);
  if p_seats < focus.seats_taken(cur.id) then
    raise exception 'more seats are taken' using errcode = '22023', hint = 'seats_taken';
  end if;
  update focus.study_table t
     set topic = nullif(btrim(p_topic), ''), room_key = p_room_key, starts_at = p_starts_at,
         ends_at = p_starts_at + make_interval(mins => p_minutes), seats = p_seats,
         focus_minutes = p_focus_minutes, break_minutes = p_break_minutes,
         long_break_minutes = coalesce(p_long_break_minutes, 0), long_every = coalesce(p_long_every, 0),
         host_show_name = coalesce(p_show_name, false),
         version = t.version + 1, updated_at = now()
   where t.id = cur.id
  returning * into saved;
  return focus.table_json(saved, uid);
end $$;

create function public.cancel_table(p_link text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := focus.require_user();
  cur focus.study_table := focus.find_table(p_link);
  saved focus.study_table;
begin
  if cur.id is null or cur.host <> uid then
    raise exception 'table not found' using errcode = 'P0002', hint = 'not_found';
  end if;
  update focus.study_table t
     set cancelled_at = coalesce(t.cancelled_at, now()), version = t.version + 1, updated_at = now()
   where t.id = cur.id
  returning * into saved;
  return focus.table_json(saved, uid);
end $$;

-- Anyone with the link: the table, or null when unknown or long over.
create function public.get_table(p_link text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  cur focus.study_table := focus.find_table(p_link);
begin
  if cur.id is null then return null; end if;
  return focus.table_json(cur, auth.uid());
end $$;

-- Link previews: no names, no viewer, nothing personal.
create function public.table_preview(p_link text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  cur focus.study_table := focus.find_table(p_link);
begin
  if cur.id is null then return null; end if;
  return jsonb_build_object(
    'topic', cur.topic,
    'room_code', (select r.code from focus.room r where r.room_key = cur.room_key),
    'starts_at', cur.starts_at,
    'ends_at', cur.ends_at,
    'seats', cur.seats,
    'taken', focus.seats_taken(cur.id),
    'cancelled', cur.cancelled_at is not null
  );
end $$;

-- p_answer is 'seat', 'maybe' or 'no'; 'no' removes the reply.
create function public.reply_table(p_link text, p_answer text, p_show_name boolean default false) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := focus.require_user();
  cur focus.study_table := focus.find_table(p_link);
  had text;
begin
  if cur.id is null then
    raise exception 'table not found' using errcode = 'P0002', hint = 'not_found';
  end if;
  if cur.host = uid then
    raise exception 'the host always has a seat' using errcode = '22023', hint = 'host_reply';
  end if;
  if cur.seats = 1 then
    raise exception 'a table for one has no guests' using errcode = '22023', hint = 'solo_table';
  end if;
  if cur.cancelled_at is not null or cur.ends_at <= now() then
    raise exception 'table is closed' using errcode = '22023', hint = 'table_closed';
  end if;
  if p_answer is null or p_answer not in ('seat', 'maybe', 'no') then
    raise exception 'invalid answer' using errcode = '22023', hint = 'invalid_answer';
  end if;
  perform focus.require_identity(uid);
  if p_answer = 'no' then
    delete from focus.table_reply r where r.table_id = cur.id and r.user_id = uid;
    return focus.table_json(cur, uid);
  end if;
  -- Lock the table so two people can't take the last seat at once.
  perform 1 from focus.study_table t where t.id = cur.id for update;
  select r.answer into had from focus.table_reply r where r.table_id = cur.id and r.user_id = uid;
  if p_answer = 'seat' and coalesce(had, '') <> 'seat' and focus.seats_taken(cur.id) >= cur.seats then
    raise exception 'table is full' using errcode = '22023', hint = 'table_full';
  end if;
  insert into focus.table_reply (table_id, user_id, answer, show_name)
  values (cur.id, uid, p_answer, coalesce(p_show_name, false))
  on conflict (table_id, user_id) do update
     set answer = excluded.answer, show_name = excluded.show_name, updated_at = now();
  return focus.table_json(cur, uid);
end $$;

-- The caller's tables: hosted ones and ones with a seat or a maybe, next
-- first. Cancelled tables stay until they end, so guests see it.
create function public.my_tables() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(focus.table_json(t, focus.require_user()) order by t.starts_at), '[]'::jsonb)
    from focus.study_table t
   where t.ends_at > now()
     and (t.host = focus.require_user()
          or exists (select 1 from focus.table_reply r
                      where r.table_id = t.id and r.user_id = focus.require_user()))
$$;

-- ── Retention ───────────────────────────────────────────────────────────
create or replace function focus.cleanup() returns void
language plpgsql set search_path = '' as $$
begin
  perform focus.close_stale(null);
  delete from focus.session s where s.ended_at < now() - interval '24 hours';
  delete from focus.study_table t where t.ends_at < now() - interval '24 hours';
end $$;
revoke all on function focus.cleanup() from public, anon, authenticated;

-- ── Grants ──────────────────────────────────────────────────────────────
revoke all on function
  public.set_table(text, text, timestamptz, integer, integer, integer, integer, integer, integer, boolean),
  public.change_table(text, integer, text, text, timestamptz, integer, integer, integer, integer, integer, integer, boolean),
  public.cancel_table(text),
  public.get_table(text),
  public.table_preview(text),
  public.reply_table(text, text, boolean),
  public.my_tables()
from public, anon, authenticated;

grant execute on function public.get_table(text), public.table_preview(text) to anon, authenticated;
grant execute on function
  public.set_table(text, text, timestamptz, integer, integer, integer, integer, integer, integer, boolean),
  public.change_table(text, integer, text, text, timestamptz, integer, integer, integer, integer, integer, integer, boolean),
  public.cancel_table(text),
  public.reply_table(text, text, boolean),
  public.my_tables()
to authenticated;
