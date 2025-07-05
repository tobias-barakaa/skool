import * as Joi from 'joi';

export default Joi.object({
    NODE_ENV: Joi.string().valid('development', 'test', 'production', 'sataging').default('development'),
    DATABASE_PORT: Joi.number().port().default(5432),
    DATABASE_PASSWORD: Joi.string().required(),
    DATABASE_USER: Joi.string().required().default('skool_owner'),
    DATABASE_NAME: Joi.string().required().default('skool_owner'),
    DATABASE_HOST: Joi.string().required(),
    DATABASE_SYNC: Joi.string().valid('true', 'false').default('false'),
    DATABASE_AUTOLOAD: Joi.string().valid('true', 'false').default('false'),
    
})