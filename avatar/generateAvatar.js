const {
  accessories,
  clothes,
  clothesColor,
  clothesGraphic,
  eyebrows,
  eyes,
  facialHair,
  facialHairColors,
  hairColors,
  hatColors,
  mouth,
  skin,
  top
} = require("./data");

const getRandom = length => {
  return Math.floor(Math.random() * length);
};

const generateRandomAvatar = avatarType => {
  const accessory = accessories[getRandom(accessories.length)];
  const facialHairStyle = facialHair[getRandom(facialHair.length)];
  const facialHairColor = facialHairColors[getRandom(facialHairColors.length)];
  const hatColor = hatColors[getRandom(hatColors.length)];
  const hairColor = hairColors[getRandom(hairColors.length)];
  const clothingColor = clothesColor[getRandom(clothesColor.length)];
  const clothingGraphic = clothesGraphic[getRandom(clothesGraphic.length)];
  const clothing = clothes[getRandom(clothes.length)];
  const eyebrow = eyebrows[getRandom(eyebrows.length)];
  const eyesStyle = eyes[getRandom(eyes.length)];
  const mouthStyle = mouth[getRandom(mouth.length)];
  const skinStyle = skin[getRandom(skin.length)];
  const topStyle = top[getRandom(top.length)];

  let avatarStyle = "Transparent";
  if (Math.floor(Math.random() * 2) === 1) {
    avatarStyle = "Circle";
  }

  return `https://avataaars.io/?avatarStyle=${avatarType ||
    avatarStyle}&topType=${topStyle}&accessoriesType=${accessory}&hairColor=${hairColor}&hatColor=${hatColor}&facialHairType=${facialHairStyle}&facialHairColor=${facialHairColor}&clotheType=${clothing}&clotheColor=${clothingColor}&graphicType=${clothingGraphic}&eyeType=${eyesStyle}&eyebrowType=${eyebrow}&mouthType=${mouthStyle}&skinColor=${skinStyle}`;
};

module.exports = { generateRandomAvatar };
