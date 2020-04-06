const Joi = require("@hapi/joi");

function validateNewUser(user) {
  const schema = Joi.object({
    firstName: Joi.string()
      .min(3)
      .max(50)
      .required(),
    lastName: Joi.string()
      .min(3)
      .max(50)
      .required(),
    email: Joi.string()
      .min(5)
      .max(255)
      .required()
      .email(),
    password: Joi.string()
      .min(5)
      .max(50)
      .required()
  });
  return schema.validate(user);
}

function validateExistingUser(user) {
  const schema = Joi.object({
    password: Joi.string()
      .min(5)
      .max(50)
      .required(),
    email: Joi.string()
      .min(5)
      .max(255)
      .required()
      .email()
  });
  return schema.validate(user);
}
function validateUpdate(user) {
  const schema = Joi.object({
    firstName: Joi.string()
      .min(3)
      .max(50),
    lastName: Joi.string()
      .min(3)
      .max(50),
    email: Joi.string()
      .min(5)
      .max(255)
      .email()
  });
  return schema.validate(user);
}

exports.validateNewUser = validateNewUser;
exports.validateExistingUser = validateExistingUser;
exports.validateUpdate = validateUpdate;
