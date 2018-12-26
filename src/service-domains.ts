import * as Joi from 'joi';

export interface IQualifierDefinition {
    name: string;
    schema: Joi.ObjectSchema;
}

export interface IServiceDomainDefinition {
    crParameterName: string;
    crPropertyName: string;
    qualifiers: { [name: string]: IQualifierDefinition; };
}

function createQualifierSchema(name: string): Joi.ObjectSchema {
    const keys = {};
    keys[name + 'Id'] = Joi.string().alphanum().required();
    return Joi.object().required().keys(keys);
}

function createQualifier(name: string): IQualifierDefinition {
    return {
        name: name,
        schema: createQualifierSchema(name)
    };
}

export const serviceDomains: { [name: string]: IServiceDomainDefinition; } = {
    'customer-offer': {
        crParameterName: 'customer-offer-procedure',
        crPropertyName: 'customerOfferProcedure',
        qualifiers: {
            customer: createQualifier('customer'),
            product: createQualifier('product'),
        },
    },
};
